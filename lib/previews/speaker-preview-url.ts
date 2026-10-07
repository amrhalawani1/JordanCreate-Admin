/** The public website, which hosts the preview pages. Local dev: NEXT_PUBLIC_WEBSITE_ORIGIN=http://localhost:3001 */
export const WEBSITE_ORIGIN = (process.env.NEXT_PUBLIC_WEBSITE_ORIGIN ?? "https://www.jordancreate.com").replace(/\/$/, "");

export interface SpeakerPreviewValues {
  handle?: string;
  photo_url?: string | null;
  followers_range?: string | null;
  tagline?: string | null;
  known_for?: string | null;
  description?: string | null;
}

/**
 * jordancreate.com/preview/speaker renders the speakers-page card and the
 * speaker page with the website's own components from these (unsaved)
 * values. Opened in a new tab from the form.
 */
export function speakerPreviewUrl(values: SpeakerPreviewValues, instagram?: string): string {
  const q = new URLSearchParams();
  const set = (k: string, v: string | null | undefined) => {
    const t = (v ?? "").trim();
    if (t) q.set(k, t);
  };
  set("handle", values.handle);
  set("photo", values.photo_url);
  set("followers", values.followers_range);
  set("tagline", values.tagline);
  set("known_for", values.known_for);
  set("description", values.description);
  set("instagram", instagram);
  return `${WEBSITE_ORIGIN}/preview/speaker?${q.toString()}`;
}
