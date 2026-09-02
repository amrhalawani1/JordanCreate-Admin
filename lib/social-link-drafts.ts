import { SOCIAL_PLATFORM_VALUES, type SocialLinkDraft, type SocialPlatform } from "@/types/entities";

function asPlatform(value: string): SocialPlatform {
  return (SOCIAL_PLATFORM_VALUES as readonly string[]).includes(value)
    ? (value as SocialPlatform)
    : "Other";
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
