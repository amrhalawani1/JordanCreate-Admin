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
    const formData = new FormData();
    formData.set("folder", folder);
    formData.set("slug", slug);
    formData.set("file", file);
    const result = await uploadMedia(formData);
    setUploading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    onChange(result.publicUrl);
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
