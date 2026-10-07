"use client";

import { cn } from "@/lib/utils";
import { websiteDisplay } from "@/lib/previews/website-font";
import {
  websiteFollowersLabel,
  websiteHasOwnBio,
  websiteSpeakerName,
} from "@/lib/previews/website-speaker-names";

export interface SpeakerPreviewValues {
  handle?: string;
  photo_url?: string | null;
  followers_range?: string | null;
  tagline?: string | null;
  known_for?: string | null;
  category?: string | null;
}

// jordancreate.com tokens (src/app/globals.css on the website).
const SITE = {
  canvas: "#141210",
  surface: "#1c1916",
  text: "#f5efe6",
  gray: "#8a8278",
  orange: "#ea8f2d",
  gradient: "linear-gradient(111deg, #eebc2b 0%, #faac44 1.1538%, #fe7a1f 100%)",
};

/**
 * How this speaker will look on jordancreate.com, drawn from the form's
 * current (unsaved) values. Left: the card from /speakers and the home
 * lineup. Right: the top of the speaker's detail page. Mirrors the website's
 * PortraitCard — keep the two in step when the site's card changes.
 */
export function SpeakerPreview({ values }: { values: SpeakerPreviewValues }) {
  const handle = values.handle?.trim() ?? "";
  const name = handle ? websiteSpeakerName(handle) : "Speaker name";
  const followers = websiteFollowersLabel(values.followers_range);
  const photo = values.photo_url?.trim() || null;
  const keepsSiteBio = handle ? websiteHasOwnBio(handle) : false;
  const bio = (values.known_for?.trim() || values.tagline?.trim() || "").trim();

  return (
    <div
      className={cn(websiteDisplay.variable, "rounded-[var(--jc-radius-card)] border border-border p-4 sm:p-5")}
      style={{ background: SITE.canvas, color: SITE.text }}
    >
      <div className="grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
        {/* Card as on /speakers and the home lineup */}
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.18em]" style={{ color: SITE.gray }}>
            Speakers page card
          </p>
          <div className="rounded-[4px] border border-white/10 p-1" style={{ background: SITE.surface }}>
            <div
              className="relative aspect-[3/4] w-full overflow-hidden rounded-[4px] border border-white/10"
              style={{
                WebkitMaskImage: "linear-gradient(352deg, rgba(0,0,0,0) 11%, #000 65%)",
                maskImage: "linear-gradient(352deg, rgba(0,0,0,0) 11%, #000 65%)",
                background: SITE.canvas,
              }}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-top grayscale"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[11px]" style={{ color: SITE.gray }}>
                  No photo yet
                </div>
              )}
            </div>
            <div className="-mt-5 flex flex-col gap-1 p-3">
              <p
                className="font-[family-name:var(--font-website-display)] text-[18px] italic leading-[1.2] tracking-[-0.4px]"
                style={{ color: SITE.text }}
              >
                {name}
              </p>
              {followers ? (
                <p className="text-[13px] leading-[1.4]" style={{ color: SITE.gray }}>
                  {followers}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Top of the detail page */}
        <div className="min-w-0">
          <p className="mb-2 text-[10px] uppercase tracking-[0.18em]" style={{ color: SITE.gray }}>
            Speaker page
          </p>
          <div className="rounded-[4px] border border-white/10 p-4" style={{ background: SITE.surface }}>
            <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: SITE.gray }}>
              Volume 3 speaker
            </p>
            <p
              className="mt-2 font-[family-name:var(--font-website-display)] text-[28px] italic leading-[1.15] sm:text-[32px]"
              style={{ color: SITE.text }}
            >
              {name}
            </p>
            {followers ? (
              <span
                className="mt-3 inline-block rounded-full px-3 py-1 text-[13px] font-medium"
                style={{ background: SITE.gradient, color: "#0f0f0f" }}
              >
                {followers}
              </span>
            ) : null}
            <p className="mt-3 text-[14px] leading-[1.5]" style={{ color: "rgba(245,239,230,0.8)" }}>
              {keepsSiteBio
                ? "This speaker keeps the website's existing bio. The text below (Known for / Tagline) is what the app and new listings use."
                : bio || "The bio comes from \"Known for\" (or the tagline when that is empty)."}
            </p>
            {keepsSiteBio && bio ? (
              <p className="mt-2 text-[13px] leading-[1.5]" style={{ color: SITE.gray }}>
                {bio}
              </p>
            ) : null}
          </div>
          <p className="mt-3 text-[11px] leading-[1.5]" style={{ color: SITE.gray }}>
            Live on jordancreate.com within about a minute of saving. The website keeps its own name
            {keepsSiteBio ? " and bio " : " "}for returning speakers; new speakers are named from the handle.
          </p>
        </div>
      </div>
    </div>
  );
}
