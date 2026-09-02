"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EntityDrawer } from "@/components/shared/EntityDrawer";
import { EntityForm } from "@/components/shared/EntityForm";
import { SocialLinksEditor } from "@/components/shared/fields/SocialLinksEditor";
import { buildGuestConfig } from "@/lib/entity-configs/guest-profiles";
import { GuestProfileSchema, type GuestProfileFormValues } from "@/lib/validation/guest-profiles";
import { createGuestProfile, updateGuestProfile, deleteGuestProfile } from "@/actions/guest-profiles";
import { replaceGuestSocialLinks } from "@/actions/guest-social-links";
import { toSocialLinkDrafts } from "@/lib/social-link-drafts";
import { serializeChipList } from "@/lib/utils";
import type { GuestProfile, GuestSocialLink, SocialLinkDraft } from "@/types/entities";

const EMPTY_VALUES = {
  guest_id: "",
  guest_name: "",
  stated_interests: "",
  arrival_status: "not_arrived",
  vip_flag: false,
  role: "",
  bio: "",
  photo_url: "",
  location: "",
  phone_number: "",
  attended_jc1: false,
  attended_jc2: false,
};

export function GuestsClient({
  initialData,
  socialLinks,
}: {
  initialData: GuestProfile[];
  socialLinks: GuestSocialLink[];
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<GuestProfile | null>(null);
  const [linkDrafts, setLinkDrafts] = useState<SocialLinkDraft[]>([]);
  const [draftGuestId, setDraftGuestId] = useState("");

  const config = useMemo(() => {
    const arrivalStatuses = Array.from(
      new Set(initialData.map((r) => r.arrival_status).filter((v): v is string => Boolean(v))),
    ).sort();
    return buildGuestConfig(arrivalStatuses);
  }, [initialData]);

  function linksFor(guestId: string) {
    return toSocialLinkDrafts(socialLinks.filter((link) => link.guest_id === guestId));
  }

  function openAdd() {
    setEditingRow(null);
    setLinkDrafts([]);
    setDraftGuestId(crypto.randomUUID());
    setDrawerOpen(true);
  }

  function openEdit(row: GuestProfile) {
    setEditingRow(row);
    setLinkDrafts(linksFor(row.guest_id));
    setDrawerOpen(true);
  }

  const defaultValues = (
    editingRow
      ? {
          guest_id: editingRow.guest_id,
          guest_name: editingRow.guest_name ?? "",
          stated_interests: serializeChipList(editingRow.stated_interests ?? []),
          arrival_status: editingRow.arrival_status ?? "",
          vip_flag: Boolean(editingRow.vip_flag),
          role: editingRow.role ?? "",
          bio: editingRow.bio ?? "",
          photo_url: editingRow.photo_url ?? "",
          location: editingRow.location ?? "",
          phone_number: editingRow.phone_number ?? "",
          attended_jc1: editingRow.attended_jc1,
          attended_jc2: editingRow.attended_jc2,
        }
      : { ...EMPTY_VALUES, guest_id: draftGuestId }
  ) as GuestProfileFormValues;

  return (
    <div>
      <DataTable
        config={config}
        data={initialData}
        onRowClick={openEdit}
        onAddClick={openAdd}
        addLabel="Add guest"
        onDelete={(row) => deleteGuestProfile(row.guest_id)}
        onDeleted={() => {
          toast.success("Guest deleted.");
          router.refresh();
        }}
        emptyMessage="No guests yet. Add the first one to get started."
      />

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingRow ? (editingRow.guest_name ?? "Guest") : "Add Guest"}
      >
        <EntityForm
          key={editingRow?.guest_id ?? draftGuestId ?? "new"}
          fields={config.formFields}
          schema={GuestProfileSchema}
          defaultValues={defaultValues}
          startInShowMode={!!editingRow}
          disabledFields={editingRow ? ["guest_id"] : []}
          submitLabel={editingRow ? "Save changes" : "Add guest"}
          onCancel={() => {
            if (editingRow) setLinkDrafts(linksFor(editingRow.guest_id));
          }}
          onSubmit={async (values) => {
            const result = editingRow
              ? await updateGuestProfile(editingRow.guest_id, values)
              : await createGuestProfile(values);
            if (!result.success || !editingRow) return result;
            return replaceGuestSocialLinks(editingRow.guest_id, linkDrafts);
          }}
          onSuccess={() => {
            setDrawerOpen(false);
            toast.success(editingRow ? "Guest updated." : "Guest added.");
            router.refresh();
          }}
        >
          {({ isEditing }) =>
            editingRow ? (
              <SocialLinksEditor value={linkDrafts} onChange={setLinkDrafts} disabled={!isEditing} />
            ) : (
              <p className="text-sm text-muted-foreground">Save the guest first to add social links.</p>
            )
          }
        </EntityForm>
      </EntityDrawer>
    </div>
  );
}
