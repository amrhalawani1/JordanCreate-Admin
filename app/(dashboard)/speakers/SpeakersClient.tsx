"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EntityDrawer } from "@/components/shared/EntityDrawer";
import { EntityForm } from "@/components/shared/EntityForm";
import { SocialLinksEditor } from "@/components/shared/fields/SocialLinksEditor";
import { buildSpeakerConfig } from "@/lib/entity-configs/speakers";
import { SpeakerSchema, type SpeakerFormValues } from "@/lib/validation/speakers";
import { createSpeaker, updateSpeaker, deleteSpeaker } from "@/actions/speakers";
import { replaceSpeakerSocialLinks } from "@/actions/speaker-social-links";
import { toSocialLinkDrafts } from "@/lib/social-link-drafts";
import { serializeChipList } from "@/lib/utils";
import type { SocialLinkDraft, Speaker, SpeakerSocialLink } from "@/types/entities";

const EMPTY_VALUES = {
  handle: "",
  tagline: "",
  category: "",
  followers_range: "",
  known_for: "",
  availability: "",
  bio_status: "unconfirmed" as const,
  photo_url: "",
  tags: "",
};

export function SpeakersClient({
  initialData,
  socialLinks,
}: {
  initialData: Speaker[];
  socialLinks: SpeakerSocialLink[];
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Speaker | null>(null);
  const [linkDrafts, setLinkDrafts] = useState<SocialLinkDraft[]>([]);

  const config = useMemo(() => {
    const categories = Array.from(
      new Set(initialData.map((r) => r.category).filter((v): v is string => Boolean(v))),
    ).sort();
    return buildSpeakerConfig(categories);
  }, [initialData]);

  function linksFor(handle: string) {
    return toSocialLinkDrafts(socialLinks.filter((link) => link.speaker_handle === handle));
  }

  function openAdd() {
    setEditingRow(null);
    setLinkDrafts([]);
    setDrawerOpen(true);
  }

  function openEdit(row: Speaker) {
    setEditingRow(row);
    setLinkDrafts(linksFor(row.handle));
    setDrawerOpen(true);
  }

  const defaultValues = (
    editingRow
      ? {
          handle: editingRow.handle,
          tagline: editingRow.tagline ?? "",
          category: editingRow.category ?? "",
          followers_range: editingRow.followers_range ?? "",
          known_for: editingRow.known_for ?? "",
          availability: editingRow.availability ?? "",
          bio_status: editingRow.bio_status,
          photo_url: editingRow.photo_url ?? "",
          tags: serializeChipList(editingRow.tags ?? []),
        }
      : EMPTY_VALUES
  ) as SpeakerFormValues;

  return (
    <div>
      <DataTable
        config={config}
        data={initialData}
        onRowClick={openEdit}
        onAddClick={openAdd}
        onDelete={(row) => deleteSpeaker(row.handle)}
        onDeleted={() => {
          toast.success("Speaker deleted.");
          router.refresh();
        }}
        emptyMessage="No speakers yet. Add the first one to get started."
        rowClassName={(row) =>
          row.bio_status === "missing" ? "border-l-2 border-l-orange bg-orange/5" : undefined
        }
      />

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingRow ? editingRow.handle : "Add Speaker"}
      >
        <EntityForm
          key={editingRow?.handle ?? "new"}
          fields={config.formFields}
          schema={SpeakerSchema}
          defaultValues={defaultValues}
          startInShowMode={!!editingRow}
          disabledFields={editingRow ? ["handle"] : []}
          submitLabel={editingRow ? "Save changes" : "Add speaker"}
          onCancel={() => {
            if (editingRow) setLinkDrafts(linksFor(editingRow.handle));
          }}
          onSubmit={async (values) => {
            const result = editingRow
              ? await updateSpeaker(editingRow.handle, values)
              : await createSpeaker(values);
            if (!result.success || !editingRow) return result;
            return replaceSpeakerSocialLinks(editingRow.handle, linkDrafts);
          }}
          onSuccess={() => {
            setDrawerOpen(false);
            toast.success(editingRow ? "Speaker updated." : "Speaker added.");
            router.refresh();
          }}
        >
          {({ isEditing }) =>
            editingRow ? (
              <SocialLinksEditor value={linkDrafts} onChange={setLinkDrafts} disabled={!isEditing} />
            ) : (
              <p className="text-sm text-muted-foreground">Save the speaker first to add social links.</p>
            )
          }
        </EntityForm>
      </EntityDrawer>
    </div>
  );
}
