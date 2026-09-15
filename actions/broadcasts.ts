"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertStaff, requireStaff } from "@/lib/auth/guard";
import { getReadableError } from "@/lib/errors";
import { logChange } from "@/lib/audit";
import { toE164 } from "@/lib/phone";
import { BroadcastSchema } from "@/lib/validation/broadcasts";
import { explainSendFailure, expoTransport, sendToDevices, uniquePushTokens } from "@/lib/broadcasts/send";
import type { BroadcastListItem } from "@/types/entities";

type AdminClient = ReturnType<typeof createAdminClient>;

export type SendBroadcastResult =
  | { success: true; recipients: number; delivered: number; failed: number; test: boolean }
  | { success: false; error: string };

async function allDeviceTokens(supabase: AdminClient): Promise<string[]> {
  const tokens: string[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase.from("push_devices").select("token").order("id").range(from, from + page - 1);
    if (error) throw error;
    tokens.push(...(data ?? []).map((row) => row.token));
    if (!data || data.length < page) break;
  }
  return tokens;
}

async function guestDeviceTokens(supabase: AdminClient, phone: string): Promise<{ guestName: string; tokens: string[] } | null> {
  const { data: guest, error } = await supabase
    .from("guest_profiles")
    .select("guest_id, guest_name")
    .eq("phone_number", phone)
    .maybeSingle();
  if (error) throw error;
  if (!guest) return null;
  const { data: devices, error: devicesError } = await supabase.from("push_devices").select("token").eq("guest_id", guest.guest_id);
  if (devicesError) throw devicesError;
  return { guestName: guest.guest_name ?? "that guest", tokens: (devices ?? []).map((row) => row.token) };
}

export async function getBroadcasts(): Promise<{ rows: BroadcastListItem[]; deviceCount: number; error?: string }> {
  try {
    await assertStaff();
    const supabase = createAdminClient();
    const [{ data, error }, tokens] = await Promise.all([
      supabase.from("broadcasts").select("*").order("created_at", { ascending: false }).limit(50),
      allDeviceTokens(supabase),
    ]);
    if (error) throw error;

    const senderIds = [...new Set((data ?? []).map((row) => row.created_by))];
    const names = new Map<string, string>();
    if (senderIds.length) {
      const { data: admins } = await supabase.from("admins").select("id, first_name, last_name").in("id", senderIds);
      for (const admin of admins ?? []) names.set(admin.id, `${admin.first_name} ${admin.last_name}`.trim());
    }

    return {
      rows: (data ?? []).map((row) => ({ ...row, sender_name: names.get(row.created_by) ?? "" })),
      deviceCount: uniquePushTokens(tokens).length,
    };
  } catch (err) {
    return { rows: [], deviceCount: 0, error: getReadableError(err) };
  }
}

export async function sendBroadcast(values: unknown): Promise<SendBroadcastResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;

  const parsed = BroadcastSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Check the message and try again." };
  const { body, deepLink, audience } = parsed.data;
  const isTest = audience === "test";
  const supabase = createAdminClient();
  let insertedId: string | null = null;

  try {
    let tokens: string[];
    let audienceLabel = "every guest with event updates on";

    if (isTest) {
      const phone = toE164(parsed.data.testPhone ?? "")!;
      const guest = await guestDeviceTokens(supabase, phone);
      if (!guest) return { success: false, error: "No guest account uses that phone number." };
      if (!uniquePushTokens(guest.tokens).length) {
        return {
          success: false,
          error: `${guest.guestName} hasn't turned on event updates. In the app: Menu, Settings, Event updates.`,
        };
      }
      tokens = guest.tokens;
      audienceLabel = `a test to ${guest.guestName}`;
    } else {
      tokens = await allDeviceTokens(supabase);
      if (!uniquePushTokens(tokens).length) {
        return { success: false, error: "No phones have turned on event updates yet, so there is no one to send to." };
      }
    }

    // Test sends are not recorded as broadcasts, so the history only shows what guests received.
    let broadcastId = `test-${Date.now()}`;
    if (!isTest) {
      const { data: row, error } = await supabase
        .from("broadcasts")
        .insert({ body, deep_link: deepLink || null, created_by: gate.admin.id, status: "sending" })
        .select("id")
        .single();
      if (error) throw error;
      broadcastId = row.id;
      insertedId = row.id;
    }

    const outcome = await sendToDevices(
      { id: broadcastId, body, deepLink: deepLink || null },
      tokens,
      {
        async deleteDeviceTokens(dead) {
          await supabase.from("push_devices").delete().in("token", dead);
        },
      },
      (messages) => expoTransport(messages, process.env.EXPO_ACCESS_TOKEN?.trim() || undefined),
    );

    if (!isTest) {
      const { error } = await supabase
        .from("broadcasts")
        .update({
          status: outcome.delivered > 0 ? "sent" : "failed",
          sent_at: new Date().toISOString(),
          recipients: outcome.recipients,
          delivered: outcome.delivered,
          failed: outcome.failed,
        })
        .eq("id", broadcastId);
      if (error) throw error;
    }

    await logChange({
      actor: gate.admin,
      action: "create",
      table: "broadcasts",
      recordId: isTest ? null : broadcastId,
      summary: `Sent notification to ${audienceLabel}: "${body.slice(0, 60)}" (${outcome.delivered}/${outcome.recipients} accepted)`,
      after: { body, deep_link: deepLink || null, audience, ...outcome },
    });
    revalidatePath("/broadcasts");

    if (outcome.delivered === 0) return { success: false, error: explainSendFailure(outcome.lastError) };
    return { success: true, recipients: outcome.recipients, delivered: outcome.delivered, failed: outcome.failed, test: isTest };
  } catch (err) {
    // Never leave a broadcast stuck on "Sending" if something broke mid-way.
    if (insertedId) {
      await supabase
        .from("broadcasts")
        .update({ status: "failed", sent_at: new Date().toISOString() })
        .eq("id", insertedId)
        .eq("status", "sending");
    }
    return { success: false, error: getReadableError(err) };
  }
}
