import { getCommunityArticles } from "@/actions/community-articles";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { isScheduled } from "@/lib/articles/schedule";
import { WEBSITE_ORIGIN } from "@/lib/previews/speaker-preview-url";
import { CommunityArticlesClient } from "./CommunityArticlesClient";

export default async function CommunityArticlesPage() {
  const articles = await getCommunityArticles();
  const tags = [...new Set(articles.map((article) => article.tag))].sort((a, b) => a.localeCompare(b));
  const live = articles.filter((article) => article.status === "published" && !isScheduled(article)).length;
  const scheduled = articles.filter((article) => isScheduled(article)).length;
  const drafts = articles.filter((article) => article.status === "draft").length;

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Community Articles"
        description="The articles on jordancreate.com/community. Published articles appear on the website within a minute of saving; drafts stay here."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">
          {live} live · {scheduled > 0 ? `${scheduled} scheduled · ` : ""}
          {drafts} draft
        </Badge>
        <a
          href={`${WEBSITE_ORIGIN}/community`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Open the Community page ↗
        </a>
      </div>

      <CommunityArticlesClient initialData={articles} tags={tags} />
    </div>
  );
}
