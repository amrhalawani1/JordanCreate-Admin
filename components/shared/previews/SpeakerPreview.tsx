"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";

export interface SpeakerPreviewValues {
  handle?: string;
  photo_url?: string | null;
  followers_range?: string | null;
  tagline?: string | null;
  known_for?: string | null;
}

/** The public website, which hosts the preview page. Override locally with NEXT_PUBLIC_WEBSITE_ORIGIN=http://localhost:3001. */
const WEBSITE_ORIGIN = (process.env.NEXT_PUBLIC_WEBSITE_ORIGIN ?? "https://www.jordancreate.com").replace(/\/$/, "");

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/**
 * The real jordancreate.com rendering of this speaker, from the form's
 * current (unsaved) values: the website's /preview/speaker page draws the
 * speakers-page card and the speaker page with its own components, embedded
 * here. Updates ~400 ms after you stop typing; nothing is saved.
 */
export function SpeakerPreview({ values, instagram }: { values: SpeakerPreviewValues; instagram?: string }) {
  const url = useMemo(() => {
    const q = new URLSearchParams();
    if (values.handle?.trim()) q.set("handle", values.handle.trim());
    if (values.photo_url?.trim()) q.set("photo", values.photo_url.trim());
    if (values.followers_range?.trim()) q.set("followers", values.followers_range.trim());
    if (values.tagline?.trim()) q.set("tagline", values.tagline.trim());
    if (values.known_for?.trim()) q.set("known_for", values.known_for.trim());
    if (instagram?.trim()) q.set("instagram", instagram.trim());
    return `${WEBSITE_ORIGIN}/preview/speaker?${q.toString()}`;
  }, [values.handle, values.photo_url, values.followers_range, values.tagline, values.known_for, instagram]);

  const src = useDebounced(url, 400);
  const [height, setHeight] = useState(640);
  // The frame is keyed by src, so "loaded" simply means the current src has fired onLoad.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loaded = loadedSrc === src;
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== WEBSITE_ORIGIN) return;
      if (e.source !== frameRef.current?.contentWindow) return;
      const data = e.data as { type?: string; height?: number } | null;
      if (data?.type === "jc-preview-height" && typeof data.height === "number" && data.height > 0) {
        setHeight(Math.min(Math.max(Math.ceil(data.height), 320), 2400));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="overflow-hidden rounded-[var(--jc-radius-card)] border border-border bg-[#141210]">
      <div className="relative">
        {!loaded ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground" aria-hidden>
            Loading preview from jordancreate.com…
          </div>
        ) : null}
        <iframe
          ref={frameRef}
          key={src}
          src={src}
          title="How this speaker will look on jordancreate.com"
          onLoad={() => setLoadedSrc(src)}
          style={{ height }}
          className="block w-full border-0 bg-[#141210] transition-[height] duration-200"
          sandbox="allow-scripts allow-same-origin"
          loading="lazy"
        />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
        <span>Rendered by the live website from these unsaved values. Nothing is saved until you press Save.</span>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 hover:text-foreground"
        >
          Open <ExternalLink className="size-3" aria-hidden />
        </a>
      </div>
    </div>
  );
}
