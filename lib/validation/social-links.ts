import { z } from "zod";
import { requiredText } from "./shared";
import { socialLinkUrl } from "@/lib/social-link-drafts";
import { SOCIAL_PLATFORM_VALUES, type SocialLinkDraft } from "@/types/entities";

export const SocialLinkDraftSchema = z
  .object({
    platform: z.enum(SOCIAL_PLATFORM_VALUES),
    handle: requiredText("Handle is required."),
  })
  .transform((row) => ({
    ...row,
    url: socialLinkUrl(row.platform, row.handle),
  }));

export function parseSocialLinkDrafts(
  values: unknown,
  options?: { min?: number },
): { ok: true; data: SocialLinkDraft[] } | { ok: false; error: string } {
  if (!Array.isArray(values)) {
    return { ok: false, error: "Social links must be a list." };
  }

  const filled = values.filter((row) => {
    if (!row || typeof row !== "object") return false;
    const record = row as Record<string, unknown>;
    const handle = typeof record.handle === "string" ? record.handle.trim() : "";
    return handle.length > 0;
  });

  const parsed = z.array(SocialLinkDraftSchema).safeParse(filled);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid social link." };
  }

  const min = options?.min ?? 0;
  if (parsed.data.length < min) {
    return {
      ok: false,
      error: min === 1 ? "At least one social link is required." : `At least ${min} social links are required.`,
    };
  }

  return { ok: true, data: parsed.data };
}
