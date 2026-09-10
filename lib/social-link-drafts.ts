import { SOCIAL_PLATFORM_VALUES, type SocialLinkDraft, type SocialPlatform } from "@/types/entities";

const SOCIAL_HOSTS: Partial<Record<SocialPlatform, string>> = {
  Instagram: "instagram.com",
  TikTok: "tiktok.com/@",
  Facebook: "facebook.com",
  Snapchat: "snapchat.com/add",
  LinkedIn: "linkedin.com/in",
  Behance: "behance.net",
};

function asPlatform(value: string): SocialPlatform {
  return (SOCIAL_PLATFORM_VALUES as readonly string[]).includes(value)
    ? (value as SocialPlatform)
    : "Other";
}

/** Builds a profile URL from platform + handle so admins only need to enter the handle. */
export function socialLinkUrl(platform: SocialPlatform, value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, "");
  const host = SOCIAL_HOSTS[platform];
  if (host) return `https://${host}/${handle}`.replace("@/", "@");
  if (!trimmed) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

export function toSocialLinkDrafts(
  links: { platform: string; handle: string; url: string; sort_order: number }[],
): SocialLinkDraft[] {
  return [...links]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((link) => ({
      platform: asPlatform(link.platform),
      handle: link.handle,
      url: link.url,
    }));
}
