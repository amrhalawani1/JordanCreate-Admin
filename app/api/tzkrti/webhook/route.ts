import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readTzkrtiConfig } from "@/lib/tzkrti/config";
import { deliveryIdFromPayload } from "@/lib/tzkrti/mapper";
import { processStoredDelivery } from "@/lib/tzkrti/process";
import { dedupeKey, sha256Hex, verifyTzkrtiRequest } from "@/lib/tzkrti/verify";
import type { Json } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Tzkrti messages are small; anything bigger is not a ticket. */
const MAX_BODY_BYTES = 512 * 1024;

const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });

/**
 * Tzkrti → Jordan Create. Every verified delivery is stored before anything
 * else, so a mapping problem or a database error never loses a ticket:
 * Tzkrti gets a 5xx and retries, and the stored copy can be replayed.
 *
 *  200  stored (and applied, ignored, or waiting for the format mapping)
 *  400  not JSON          401  bad or missing signature
 *  413  too large         503  webhook not configured on this deployment
 */
export async function POST(request: Request) {
  const config = readTzkrtiConfig();
  if (!config) return json({ error: "Tzkrti webhook is not configured." }, 503);

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) return json({ error: "Body too large." }, 413);

  const supabase = createAdminClient();
  const bodySha256 = sha256Hex(rawBody);
  const headerDeliveryId = request.headers.get(config.deliveryHeader)?.trim() || null;

  if (!verifyTzkrtiRequest({ rawBody, headers: request.headers, url: request.url }, config)) {
    // Recorded without its body: an unsigned request is not trusted with storage.
    await supabase.from("tzkrti_webhook_events").insert({
      dedupe_key: `rejected:${crypto.randomUUID()}`,
      delivery_id: headerDeliveryId,
      signature_valid: false,
      status: "rejected",
      error: "Signature did not match TZKRTI_WEBHOOK_SECRET.",
      body_sha256: bodySha256,
    });
    return json({ error: "Invalid signature." }, 401);
  }

  let payload: Json;
  try {
    payload = JSON.parse(rawBody) as Json;
  } catch {
    return json({ error: "Body is not JSON." }, 400);
  }

  const deliveryId = headerDeliveryId ?? deliveryIdFromPayload(payload);
  const key = dedupeKey(request.headers, config, bodySha256, deliveryId);
  const { data: stored, error: storeError } = await supabase
    .from("tzkrti_webhook_events")
    .upsert(
      { dedupe_key: key, delivery_id: deliveryId, signature_valid: true, status: "received", payload, body_sha256: bodySha256 },
      { onConflict: "dedupe_key", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();
  if (storeError) return json({ error: "Could not store the delivery." }, 500);

  let eventId = (stored as { id: string } | null)?.id ?? null;
  if (!eventId) {
    // Seen before. Done if it was applied; otherwise this retry gets another go.
    const { data: previous } = await supabase
      .from("tzkrti_webhook_events")
      .select("id, status")
      .eq("dedupe_key", key)
      .single();
    const prev = previous as { id: string; status: string } | null;
    if (!prev) return json({ error: "Could not store the delivery." }, 500);
    if (prev.status === "processed" || prev.status === "ignored") return json({ ok: true, duplicate: true, status: prev.status });
    eventId = prev.id;
  }

  let result;
  try {
    result = await processStoredDelivery(supabase, eventId);
  } catch {
    return json({ error: "Could not apply the delivery; please retry." }, 500);
  }

  // A database error asks Tzkrti to retry; everything else is final for them.
  if (result.status === "failed") {
    return json({ ok: false, error: "Some tickets could not be saved; please retry.", outcomes: result.outcomes }, 500);
  }
  return json({ ok: true, status: result.status, outcomes: result.outcomes, note: result.error ?? undefined });
}

/** Lets Tzkrti (or us) check the address is live without sending a ticket. */
export async function GET() {
  return json({ ok: true, service: "jordan-create-tzkrti-webhook", configured: readTzkrtiConfig() !== null });
}
