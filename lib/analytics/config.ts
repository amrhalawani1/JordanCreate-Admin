/**
 * Google Analytics connection settings, read from the environment.
 *
 * Keyless (recommended, used in production):
 *   GA4_PROPERTY_ID                 Numeric GA4 property id (Admin → Property details).
 *   GA_SERVICE_ACCOUNT_EMAIL        The read-only service account, e.g.
 *                                   ga-reader@jordan-create-admin.iam.gserviceaccount.com
 *   GCP_WORKLOAD_IDENTITY_PROVIDER  projects/<number>/locations/global/workloadIdentityPools/<pool>/providers/<provider>
 *   On Vercel, the deployment's OIDC token is exchanged with Google for a
 *   short-lived token for that service account. No key file exists.
 *
 * Key file (fallback, e.g. local work if an organization allows keys):
 *   GA4_PROPERTY_ID + GA_SERVICE_ACCOUNT_KEY (the JSON key, raw or base64).
 *
 * Never import this from a client component: a parsed key holds a private key.
 */

export type AnalyticsAuth =
  | { kind: "federated"; serviceAccountEmail: string; providerResource: string }
  | { kind: "key"; clientEmail: string; privateKey: string };

export type AnalyticsConfig = {
  propertyId: string;
  auth: AnalyticsAuth;
};

export type ConfigResult =
  | { ok: true; config: AnalyticsConfig }
  | { ok: false; missing: string[]; problem?: string };

/** What the setup guide asks for: the keyless trio. */
export const ANALYTICS_ENV_VARS = ["GA4_PROPERTY_ID", "GA_SERVICE_ACCOUNT_EMAIL", "GCP_WORKLOAD_IDENTITY_PROVIDER"] as const;

const PROVIDER_PATTERN = /^projects\/\d+\/locations\/global\/workloadIdentityPools\/[a-z0-9-]+\/providers\/[a-z0-9-]+$/;

/** The service account's email, for error messages; never secret. */
export function authEmail(auth: AnalyticsAuth): string {
  return auth.kind === "federated" ? auth.serviceAccountEmail : auth.clientEmail;
}

function decodeKey(raw: string): { client_email?: unknown; private_key?: unknown } | null {
  const text = raw.trim();
  const candidate = text.startsWith("{") ? text : Buffer.from(text, "base64").toString("utf8");
  try {
    const parsed = JSON.parse(candidate);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function readProperty(raw: string): { id: string } | { problem: string } {
  const propertyId = raw.replace(/^properties\//, "");
  if (/^G-/i.test(propertyId)) {
    return {
      problem: `GA4_PROPERTY_ID is set to the measurement id (${propertyId}). Use the numeric property id from Admin → Property details instead.`,
    };
  }
  if (!/^\d+$/.test(propertyId)) {
    return { problem: "GA4_PROPERTY_ID must be the numeric property id, e.g. 412345678." };
  }
  return { id: propertyId };
}

export function readAnalyticsConfig(env: Record<string, string | undefined> = process.env): ConfigResult {
  const get = (name: string) => env[name]?.trim() ?? "";
  const propertyRaw = get("GA4_PROPERTY_ID");
  const email = get("GA_SERVICE_ACCOUNT_EMAIL");
  const provider = get("GCP_WORKLOAD_IDENTITY_PROVIDER").replace(/^\/\/iam\.googleapis\.com\//, "");
  const keyRaw = get("GA_SERVICE_ACCOUNT_KEY");

  // A key file, when present, is used as-is; otherwise the keyless trio is required.
  if (!keyRaw) {
    const missing = ANALYTICS_ENV_VARS.filter((name) => !get(name));
    if (missing.length > 0) return { ok: false, missing: [...missing] };
  } else if (!propertyRaw) {
    return { ok: false, missing: ["GA4_PROPERTY_ID"] };
  }

  const property = readProperty(propertyRaw);
  if ("problem" in property) return { ok: false, missing: [], problem: property.problem };

  if (keyRaw) {
    const key = decodeKey(keyRaw);
    const clientEmail = typeof key?.client_email === "string" ? key.client_email : "";
    const privateKey = typeof key?.private_key === "string" ? key.private_key.replace(/\\n/g, "\n") : "";
    if (!clientEmail || !privateKey.includes("PRIVATE KEY")) {
      return {
        ok: false,
        missing: [],
        problem:
          "GA_SERVICE_ACCOUNT_KEY could not be read. Paste the whole JSON key file from Google Cloud (or its base64), including client_email and private_key.",
      };
    }
    return { ok: true, config: { propertyId: property.id, auth: { kind: "key", clientEmail, privateKey } } };
  }

  if (!/^[^@\s]+@[^@\s]+\.iam\.gserviceaccount\.com$/.test(email)) {
    return {
      ok: false,
      missing: [],
      problem: "GA_SERVICE_ACCOUNT_EMAIL must be a service account email ending in .iam.gserviceaccount.com.",
    };
  }
  if (!PROVIDER_PATTERN.test(provider)) {
    return {
      ok: false,
      missing: [],
      problem:
        "GCP_WORKLOAD_IDENTITY_PROVIDER must look like projects/123456789012/locations/global/workloadIdentityPools/vercel/providers/vercel.",
    };
  }
  return {
    ok: true,
    config: { propertyId: property.id, auth: { kind: "federated", serviceAccountEmail: email, providerResource: provider } },
  };
}
