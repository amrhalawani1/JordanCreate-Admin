"use client";

import { useRef, useState } from "react";
import { uploadMedia } from "@/actions/upload-media";
import type { MediaFolder } from "@/lib/entity-configs/types";
import { Button } from "@/components/ui/button";
import { PhotoThumb } from "./PhotoThumb";

interface ImageUploadFieldProps {
  id: string;
  value: string | null;
  folder: MediaFolder;
  slug: string;
  disabled?: boolean;
  onChange: (url: string | null) => void;
}

export function ImageUploadField({
  id,
  value,
  folder,
  slug,
  disabled = false,
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
      <div className="flex items-center gap-3">
        <PhotoThumb src={value} alt="" />
        {value ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 truncate text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">No photo yet.</p>
        )}
      </div>

      {!disabled && (
        <div
          className={`rounded-[4px] border border-dashed px-3 py-4 text-center text-sm ${
            dragging ? "border-orange bg-orange/5" : "border-white/20"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files[0]);
          }}
        >
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
          <p className="text-muted-foreground">
            {uploading ? "Uploading…" : "Drop an image here, or"}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              Choose file
            </Button>
            {value && (
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
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
