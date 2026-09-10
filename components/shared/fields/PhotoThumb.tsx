"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

function initialsFromAlt(alt: string) {
  return alt
    .trim()
    .split(/\s+/)
    .filter((part) => /^[A-Za-z0-9]/.test(part))
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const SIZE_CLASS = {
  sm: "size-9 text-[11px]",
  md: "size-12 text-xs",
  lg: "size-20 text-sm sm:size-24",
} as const;

export function PhotoThumb({
  src,
  alt,
  size = "sm",
}: {
  src: string | null | undefined;
  alt: string;
  size?: keyof typeof SIZE_CLASS;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    const initials = initialsFromAlt(alt);
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-xl bg-white/10 font-medium tracking-wide text-muted-foreground",
          SIZE_CLASS[size],
        )}
        aria-hidden={!alt}
        role={alt ? "img" : undefined}
        aria-label={alt ? `${alt} photo placeholder` : undefined}
      >
        {initials || <User className="size-4" aria-hidden />}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn("shrink-0 rounded-xl object-cover", SIZE_CLASS[size])}
      onError={() => setFailed(true)}
    />
  );
}
