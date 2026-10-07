"use server";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireGuestEditor, requireStaff } from "@/lib/auth/guard";
import { sanitizeMediaSlug } from "@/lib/utils";

const FOLDERS = ["speakers", "guests", "partners", "entertainment", "hot-topics"] as const;
type MediaFolder = (typeof FOLDERS)[number];

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_BYTES = 5 * 1024 * 1024;

export type UploadMediaResult =
  | { success: true; publicUrl: string; path: string }
  | { success: false; error: string };

function isMediaFolder(value: string): value is MediaFolder {
  return (FOLDERS as readonly string[]).includes(value);
}

export async function uploadMedia(formData: FormData): Promise<UploadMediaResult> {
  const folderRaw = String(formData.get("folder") ?? "");
  if (!isMediaFolder(folderRaw)) {
    return { success: false, error: "Choose a valid upload folder." };
  }

  const gate = folderRaw === "guests" ? await requireGuestEditor() : await requireStaff();
  if (!gate.ok) return gate;

  const slug = sanitizeMediaSlug(String(formData.get("slug") ?? ""));
  if (!slug) {
    return { success: false, error: "Fill in the name or ID before uploading a photo." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Choose an image to upload." };
  }
  if (file.size > MAX_BYTES) {
    return { success: false, error: "Images must be 5 MB or smaller." };
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return { success: false, error: "Use a PNG, JPG, WebP, or GIF image." };
  }

  try {
    const supabase = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    // Content-addressed name: a replaced photo gets a new URL, so browsers,
    // Vercel's image optimizer and the storage CDN cannot keep serving the
    // old picture (they cache the URL for up to an hour). Old files are left
    // in place because the frozen app snapshot may still point at them.
    const digest = createHash("sha1").update(buffer).digest("hex").slice(0, 8);
    const path = `${folderRaw}/${slug}-${digest}.${ext}`;
    const { error } = await supabase.storage.from("public-media").upload(path, buffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: true,
    });
    if (error) {
      return { success: false, error: error.message || "The upload failed." };
    }

    const { data } = supabase.storage.from("public-media").getPublicUrl(path);
    return { success: true, publicUrl: data.publicUrl, path };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "The upload failed.",
    };
  }
}
