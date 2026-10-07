"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2 } from "lucide-react";
import { uploadMedia } from "@/actions/upload-media";
import type { MediaFolder } from "@/lib/entity-configs/types";
import { Button } from "@/components/ui/button";
import { PhotoThumb } from "./PhotoThumb";
import { cn } from "@/lib/utils";

interface ImageUploadFieldProps {
  id: string;
  value: string | null;
  folder: MediaFolder;
  slug: string;
  disabled?: boolean;
  required?: boolean;
  onChange: (url: string | null) => void;
}


const MAX_EDGE = 1600;
const TARGET_BYTES = 1_500_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

/**
 * Downscale to ≤1600 px on the long edge and re-encode (WebP, falling back to
 * JPEG). GIFs and already-small images pass through untouched.
 */
async function shrinkImage(file: File): Promise<File> {
  if (file.type === "image/gif") return file;
  if (file.size <= TARGET_BYTES && file.type !== "image/heic") {
    // Still check dimensions: a 1 MB 6000 px PNG is worth shrinking.
    const dims = await imageDimensions(file).catch(() => null);
    if (!dims || Math.max(dims.width, dims.height) <= MAX_EDGE) return file;
  }
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const base = file.name.replace(/\.[^.]+$/, "");
  const webp = await canvasToBlob(canvas, "image/webp", 0.86);
  if (webp && webp.size > 0 && webp.type === "image/webp") return new File([webp], `${base}.webp`, { type: "image/webp" });
  const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.86);
  if (jpeg && jpeg.size > 0) return new File([jpeg], `${base}.jpg`, { type: "image/jpeg" });
  return file;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function imageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode")); };
    img.src = url;
  });
}

export function ImageUploadField({
  id,
  value,
  folder,
  slug,
  disabled = false,
  required = false,
  onChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file || disabled) return;
    if (!slug) {
      setError("Fill in the name or ID before uploading a photo.");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      // Shrink in the browser first: phone photos are 3–10 MB, which is slow
      // and over the server action body limit; the site shows portraits at
      // ≤ 700 px wide anyway.
      const prepared = await shrinkImage(file);
      const formData = new FormData();
      formData.set("folder", folder);
      formData.set("slug", slug);
      formData.set("file", prepared);
      const result = await withTimeout(uploadMedia(formData), 60_000);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onChange(result.publicUrl);
    } catch (err) {
      setError(
        err instanceof Error && err.message === "timeout"
          ? "The upload took too long. Check your connection and try again."
          : "The upload failed. Try a smaller image (under 5 MB) or a different format.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex flex-col gap-3 rounded-xl border border-border bg-white/[0.02] p-3 sm:flex-row sm:items-center",
          dragging && "border-orange bg-orange/5",
          !disabled && "transition-colors",
        )}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files[0]);
        }}
      >
        <PhotoThumb src={value} alt="" size="lg" />

        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-medium text-foreground">
              {value ? "Photo attached" : "No photo yet"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {uploading
                ? "Uploading…"
                : disabled
                  ? "Photo preview"
                  : "PNG, JPG, WEBP, or GIF. Drop a file or choose one."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!disabled ? (
              <>
                <input
                  ref={inputRef}
                  id={id}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    void handleFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => inputRef.current?.click()}
                >
                  <ImagePlus className="size-3.5" />
                  {value ? "Replace" : "Choose file"}
                </Button>
                {value && !required ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={uploading}
                    onClick={() => {
                      setError(null);
                      onChange(null);
                    }}
                  >
                    Remove
                  </Button>
                ) : null}
              </>
            ) : null}
            {value ? (
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                <Link2 className="size-3.5" />
                Open original
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
