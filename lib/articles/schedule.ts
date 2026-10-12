import type { CommunityArticle } from "@/types/entities";

/** True when the article is published but dated in the future, so the website still hides it. */
export function isScheduled(row: Pick<CommunityArticle, "status" | "published_at">, today = new Date()) {
  return row.status === "published" && row.published_at > today.toISOString().slice(0, 10);
}
