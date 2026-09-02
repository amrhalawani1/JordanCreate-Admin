import { z } from "zod";
import { requiredText } from "./shared";
import { SOCIAL_PLATFORM_VALUES, type SocialLinkDraft } from "@/types/entities";

export const SocialLinkDraftSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORM_VALUES),
  handle: requiredText("Handle is required."),
  url: z
    .string()
    .trim()
    .min(1, { message: "URL is required." })
    .refine((v) => z.url().safeParse(v).success, { message: "Enter a valid URL." }),
});

export function parseSocialLinkDrafts(values: unknown): { ok: true; data: SocialLinkDraft[] } | { ok: false; error: string } {
  if (!Array.isArray(values)) {
    return { ok: false, error: "Social links must be a list." };
  }

  const filled = values.filter((row) => {
    if (!row || typeof row !== "object") return false;
    const record = row as Record<string, unknown>;
    const handle = typeof record.handle === "string" ? record.handle.trim() : "";
    const url = typeof record.url === "string" ? record.url.trim() : "";
    return handle.length > 0 || url.length > 0;
  });

  const parsed = z.array(SocialLinkDraftSchema).safeParse(filled);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid social link." };
  }
  return { ok: true, data: parsed.data };
}
