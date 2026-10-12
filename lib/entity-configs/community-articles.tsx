"use client";

import type { EntityConfig, FilterConfig } from "./types";
import type { CommunityArticle } from "@/types/entities";
import { ARTICLE_AUTHOR_TYPE_VALUES, ARTICLE_STATUS_VALUES } from "@/types/entities";
import { PhotoThumb } from "@/components/shared/fields/PhotoThumb";
import { Badge } from "@/components/ui/badge";
import { isScheduled } from "@/lib/articles/schedule";

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function buildCommunityArticleConfig(tags: string[]): EntityConfig<CommunityArticle> {
  const filters: FilterConfig<CommunityArticle>[] = [
    { key: "status", label: "Status", options: ARTICLE_STATUS_VALUES },
  ];
  if (tags.length > 1) filters.push({ key: "tag", label: "Topic", options: tags });

  return {
    table: "community_articles",
    pkColumn: "id",
    entityLabel: "Article",
    searchKeys: ["title", "dek", "tag", "slug"],
    filters,
    columns: [
      {
        key: "cover_url",
        header: "Cover",
        className: "w-14",
        render: (row) => <PhotoThumb src={row.cover_url} alt={row.title} />,
      },
      {
        key: "title",
        header: "Title",
        render: (row) => (
          <span className="flex flex-wrap items-center gap-2">
            <span>{row.title}</span>
            {row.featured ? <Badge variant="outline">Featured</Badge> : null}
          </span>
        ),
      },
      { key: "tag", header: "Topic", render: (row) => <Badge variant="outline">{row.tag}</Badge> },
      { key: "published_at", header: "Published", render: (row) => formatDate(row.published_at) },
      {
        key: "status",
        header: "Status",
        render: (row) =>
          isScheduled(row) ? (
            <Badge variant="secondary">scheduled</Badge>
          ) : (
            <Badge variant={row.status === "published" ? "default" : "secondary"}>{row.status}</Badge>
          ),
      },
    ],
    formFields: [
      { name: "title", label: "Title", type: "text", required: true },
      {
        name: "slug",
        label: "URL slug",
        type: "text",
        required: true,
        placeholder: "e.g. how-creators-in-jordan-get-paid",
        helpText:
          "The page address: jordancreate.com/community/<slug>. Lowercase words joined by dashes. Changing it later breaks links people have already shared.",
      },
      {
        name: "dek",
        label: "Subtitle",
        type: "textarea",
        required: true,
        helpText: "One or two sentences under the title. Also used as the Google description.",
      },
      {
        name: "tag",
        label: "Topic tag",
        type: "suggest-text",
        required: true,
        placeholder: "e.g. Business",
        distinctFrom: "self",
        helpText: "One short label shown on the card, e.g. Business, Craft, Guide, Recap.",
      },
      {
        name: "status",
        label: "Status",
        type: "enum",
        required: true,
        enumValues: ARTICLE_STATUS_VALUES,
        helpText:
          "Only published articles appear on the website, and only from their publish date on. Drafts stay here.",
      },
      {
        name: "published_at",
        label: "Publish date",
        type: "date",
        required: true,
        helpText: "Shown on the article. A future date schedules it: it goes live on that day.",
      },
      {
        name: "featured",
        label: "Featured",
        type: "boolean",
        helpText: "Featured articles lead the Community page, ahead of newer ones.",
      },
      {
        name: "cover_url",
        label: "Cover image",
        type: "image",
        required: true,
        imageFolder: "community",
        imageSlugFrom: "slug",
      },
      {
        name: "cover_alt",
        label: "Cover description",
        type: "text",
        required: true,
        helpText: "What the photo shows, for screen readers and search engines.",
      },
      {
        name: "key_takeaways",
        label: "Key takeaways",
        type: "textarea",
        required: true,
        placeholder: "One takeaway per line (2 to 6).",
        helpText: "Shown in the summary box at the top of the article. One per line, 2 to 6.",
      },
      {
        name: "body",
        label: "Article body",
        type: "textarea",
        required: true,
        placeholder: "Write the article. Leave a blank line between paragraphs.",
        helpText:
          "Blank line between paragraphs. \"## \" starts a section heading (it also appears in the table of contents). Lines starting \"- \" make a bullet list. Lines starting \"> \" make a quote; end it with a line \"> — Name\" to credit someone.",
      },
      {
        name: "faq",
        label: "FAQ",
        type: "textarea",
        placeholder: "Q: The question\nA: The answer",
        helpText: "Optional, up to 6. Write \"Q: \" then the question, \"A: \" then the answer, with a blank line between pairs.",
      },
      {
        name: "keywords",
        label: "Search keywords",
        type: "chip-list",
        helpText: "Not shown on the page; used for search engines.",
      },
      {
        name: "cta_label",
        label: "Button label",
        type: "text",
        placeholder: "e.g. Buy Tickets",
        helpText: "Optional button at the end of the article. Fill in both label and link, or neither.",
      },
      {
        name: "cta_href",
        label: "Button link",
        type: "text",
        placeholder: "https://tzkrti.com/en/events/4825 or /#lineup",
      },
      { name: "author_name", label: "Author", type: "text", required: true },
      {
        name: "author_type",
        label: "Author type",
        type: "enum",
        required: true,
        enumValues: ARTICLE_AUTHOR_TYPE_VALUES,
        enumLabels: { Organization: "Organization (Jordan Create)", Person: "Person" },
      },
      {
        name: "content_updated_at",
        label: "Updated date",
        type: "date",
        helpText: "Optional. Shown as \"Updated\" when you revise an article after publishing.",
      },
    ],
    hasUpdatedAt: true,
    cardTitleKey: "title",
    describeRow: (row) =>
      `Delete "${row.title}"? It disappears from the website straight away and cannot be undone. To hide it instead, set it to draft.`,
  };
}
