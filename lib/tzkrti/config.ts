/**
 * Tzkrti webhook settings, from the environment.
 *
 *   TZKRTI_WEBHOOK_SECRET    Required. The shared secret agreed with Tzkrti.
 *   TZKRTI_SIGNATURE_MODE    "hmac-sha256" (default): Tzkrti signs the raw body with the secret.
 *                            "token": Tzkrti sends the secret itself, in the header or as ?token=.
 *   TZKRTI_SIGNATURE_HEADER  Header carrying the signature or token. Default x-tzkrti-signature.
 *   TZKRTI_DELIVERY_HEADER   Header with Tzkrti's unique delivery id, if they send one.
 *                            Default x-tzkrti-delivery. Without it, duplicates are spotted by body hash.
 *
 * Header names and mode are set from Tzkrti's documentation; no code change needed.
 */
export type SignatureMode = "hmac-sha256" | "token";

export type TzkrtiConfig = {
  secret: string;
  mode: SignatureMode;
  signatureHeader: string;
  deliveryHeader: string;
};

export function readTzkrtiConfig(env: Record<string, string | undefined> = process.env): TzkrtiConfig | null {
  const secret = env.TZKRTI_WEBHOOK_SECRET?.trim() ?? "";
  if (secret.length < 16) return null;
  const mode = env.TZKRTI_SIGNATURE_MODE?.trim().toLowerCase() === "token" ? "token" : "hmac-sha256";
  return {
    secret,
    mode,
    signatureHeader: (env.TZKRTI_SIGNATURE_HEADER?.trim() || "x-tzkrti-signature").toLowerCase(),
    deliveryHeader: (env.TZKRTI_DELIVERY_HEADER?.trim() || "x-tzkrti-delivery").toLowerCase(),
  };
}
