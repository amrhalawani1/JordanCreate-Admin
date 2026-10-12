"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ZodType } from "zod";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EntityDrawer } from "@/components/shared/EntityDrawer";
import { EntityForm } from "@/components/shared/EntityForm";
import { buildCommunityArticleConfig } from "@/lib/entity-configs/community-articles";
import { serializeArticleBody, serializeArticleFaq, serializeLines } from "@/lib/articles/text-format";
import { WEBSITE_ORIGIN } from "@/lib/previews/speaker-preview-url";
import { serializeChipList } from "@/lib/utils";
import { CommunityArticleSchema, type CommunityArticleFormValues } from "@/lib/validation/community-articles";
import {
  createCommunityArticle,
  updateCommunityArticle,
  deleteCommunityArticle,
} from "@/actions/community-articles";
import type { CommunityArticle } from "@/types/entities";

// The schema turns the form's text fields into structured values, so its
// input and output types differ; the form only ever holds the text shape.
const formSchema = CommunityArticleSchema as unknown as ZodType<CommunityArticleFormValues, CommunityArticleFormValues>;

function toFormValues(row: CommunityArticle): CommunityArticleFormValues {
  return {
    title: row.title,
    slug: row.slug,
    dek: row.dek,
    tag: row.tag,
    author_name: row.author_name,
    author_type: row.author_type,
    published_at: row.published_at,
    content_updated_at: row.content_updated_at ?? "",
    cover_url: row.cover_url,
    cover_alt: row.cover_alt,
    key_takeaways: serializeLines(row.key_takeaways ?? []),
    body: serializeArticleBody(row.body ?? []),
    faq: serializeArticleFaq(row.faq ?? []),
    keywords: serializeChipList(row.keywords ?? []),
    cta_label: row.cta_label ?? "",
    cta_href: row.cta_href ?? "",
    featured: row.featured,
    status: row.status,
  };
}

function emptyFormValues(): CommunityArticleFormValues {
  return {
    title: "",
    slug: "",
    dek: "",
    tag: "",
    author_name: "Jordan Create",
    author_type: "Organization",
    published_at: new Date().toISOString().slice(0, 10),
    content_updated_at: "",
    cover_url: "",
    cover_alt: "",
    key_takeaways: "",
    body: "",
    faq: "",
    keywords: "",
    cta_label: "Buy Tickets",
    cta_href: "https://tzkrti.com/en/events/4825",
    featured: false,
    status: "draft",
  };
}

export function CommunityArticlesClient({ initialData, tags }: { initialData: CommunityArticle[]; tags: string[] }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<CommunityArticle | null>(null);

  const config = useMemo(() => buildCommunityArticleConfig(tags), [tags]);

  function openAdd() {
    setEditingRow(null);
    setDrawerOpen(true);
  }

  function openEdit(row: CommunityArticle) {
    setEditingRow(row);
    setDrawerOpen(true);
  }

  return (
    <div>
      <DataTable
        config={config}
        data={initialData}
        onRowClick={openEdit}
        onAddClick={openAdd}
        addLabel="Add article"
        onDelete={(row) => deleteCommunityArticle(row.id)}
        onDeleted={() => {
          toast.success("Article deleted.");
          router.refresh();
        }}
        emptyMessage="No articles yet. Add the first one for jordancreate.com/community."
      />

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingRow ? editingRow.title : "Add article"}
      >
        <EntityForm
          key={editingRow?.id ?? "new"}
          fields={config.formFields}
          schema={formSchema}
          defaultValues={editingRow ? toFormValues(editingRow) : emptyFormValues()}
          startInShowMode={!!editingRow}
          submitLabel={editingRow ? "Save changes" : "Add article"}
          previewLink={(values) => `${WEBSITE_ORIGIN}/community/${encodeURIComponent(values.slug.trim())}`}
          previewLabel="Open on website"
          onSubmit={(values) =>
            editingRow ? updateCommunityArticle(editingRow.id, values) : createCommunityArticle(values)
          }
          onSuccess={() => {
            setDrawerOpen(false);
            toast.success(editingRow ? "Article saved. The website updates within a minute." : "Article added.");
            router.refresh();
          }}
        />
      </EntityDrawer>
    </div>
  );
}
