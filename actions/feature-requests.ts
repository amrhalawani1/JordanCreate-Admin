"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteRow, fetchByPk } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { FeatureRequestSchema } from "@/lib/validation/feature-requests";
import type { Admin, FeatureRequest, FeatureRequestListItem } from "@/types/entities";
import { logChange } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

export async function getFeatureRequests(): Promise<{
  rows: FeatureRequestListItem[];
  error?: string;
}> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return { rows: [], error: gate.error };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("feature_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { rows: [], error: getReadableError(error) };
  }

  const requesterIds = [
    ...new Set((data ?? []).map((row) => row.requested_by).filter((id): id is string => Boolean(id))),
  ];
  const adminsById = new Map<string, Admin>();

  if (requesterIds.length > 0) {
    const { data: admins } = await supabase.from("admins").select("*").in("id", requesterIds);
    for (const admin of admins ?? []) {
      adminsById.set(admin.id, admin);
    }
  }

  const rows: FeatureRequestListItem[] = (data ?? []).map((row) => {
    const admin = row.requested_by ? adminsById.get(row.requested_by) : undefined;
    return {
      ...row,
      requester_name: admin ? `${admin.first_name} ${admin.last_name}`.trim() : "",
      requester_email: admin?.email ?? "",
    };
  });

  return { rows };
}

export async function createFeatureRequest(values: unknown): Promise<ActionResult> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;

  const parsed = FeatureRequestSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const supabase = createAdminClient();
    const payload: { title: string; description: string; requested_by?: string } = {
      title: parsed.data.title,
      description: parsed.data.description,
    };
    const { error } = await supabase.from("feature_requests").insert(payload);
    if (error) {
      const withoutRequester = await supabase.from("feature_requests").insert({
        title: parsed.data.title,
        description: parsed.data.description,
      });
      if (withoutRequester.error) throw withoutRequester.error;
    }
    await logChange({
      actor: gate.admin,
      action: "create",
      table: "feature_requests",
      summary: `Requested feature "${parsed.data.title}"`,
      after: parsed.data,
    });
    revalidatePath("/request-a-feature");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function deleteFeatureRequest(id: string): Promise<ActionResult> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;

  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<FeatureRequest>(supabase, "feature_requests", {
      column: "id",
      value: id,
    });
    await deleteRow(supabase, "feature_requests", { column: "id", value: id });
    await logChange({
      actor: gate.admin,
      action: "delete",
      table: "feature_requests",
      recordId: id,
      summary: `Deleted feature request "${before?.title ?? id}"`,
      before,
    });
    revalidatePath("/request-a-feature");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
