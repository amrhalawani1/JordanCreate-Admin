import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { TzkrtiConfig } from "./config";

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

/** A signature as hex or base64, with or without a "sha256=" prefix. */
function signatureBytes(value: string): Buffer[] {
  const v = value.trim().replace(/^sha256=/i, "");
  const out: Buffer[] = [];
  if (/^[0-9a-f]+$/i.test(v) && v.length % 2 === 0) out.push(Buffer.from(v, "hex"));
  if (/^[A-Za-z0-9+/_-]+={0,2}$/.test(v)) {
    out.push(Buffer.from(v.replace(/-/g, "+").replace(/_/g, "/"), "base64"));
  }
  return out;
}

/**
 * True when the request really comes from Tzkrti. Constant-time comparisons;
 * the raw body must be the exact bytes received (never re-serialized JSON).
 */
export function verifyTzkrtiRequest(
  input: { rawBody: string; headers: Headers; url: string },
  config: TzkrtiConfig,
): boolean {
  const provided = input.headers.get(config.signatureHeader)?.trim() ?? "";

  if (config.mode === "token") {
    const fromQuery = new URL(input.url).searchParams.get("token")?.trim() ?? "";
    const candidate = provided.replace(/^bearer\s+/i, "") || fromQuery;
    if (!candidate) return false;
    return safeEqual(Buffer.from(candidate), Buffer.from(config.secret));
  }

  if (!provided) return false;
  const expected = createHmac("sha256", config.secret).update(input.rawBody, "utf8").digest();
  return signatureBytes(provided).some((bytes) => safeEqual(bytes, expected));
}

export function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** One key per real delivery: Tzkrti's delivery id when given, otherwise the body hash. */
export function dedupeKey(headers: Headers, config: TzkrtiConfig, bodySha256: string): string {
  const delivery = headers.get(config.deliveryHeader)?.trim();
  return delivery ? `delivery:${delivery}` : `body:${bodySha256}`;
}
