/** Turns Google API failures into something an event-team admin can act on. */

export type AnalyticsErrorKind =
  | "auth"
  | "federation"
  | "impersonation"
  | "local"
  | "permission"
  | "api-disabled"
  | "property"
  | "quota"
  | "network"
  | "unknown";

export class AnalyticsError extends Error {
  constructor(
    public readonly kind: AnalyticsErrorKind,
    message: string,
    public readonly hint: string,
  ) {
    super(message);
    this.name = "AnalyticsError";
  }
}

type GoogleErrorBody = {
  error?: string | { code?: number; message?: string; status?: string; details?: { reason?: string }[] };
  error_description?: string;
};

/**
 * Keyless sign-in happens in two hops before any report: Google's token
 * service checks the Vercel identity token, then IAM lets that identity act
 * as the read-only service account. Failures there need different fixes.
 */
export function classifyFederationError(
  stage: "exchange" | "impersonate",
  httpStatus: number,
  body: unknown,
  serviceAccountEmail: string,
): AnalyticsError {
  const b = (body ?? {}) as GoogleErrorBody;
  const detail =
    typeof b.error === "string" ? b.error_description ?? b.error : (b.error?.message ?? `HTTP ${httpStatus}`);
  if (stage === "exchange") {
    return new AnalyticsError(
      "federation",
      "Google didn't accept this deployment's Vercel identity.",
      `Check the Workload Identity provider in Google Cloud: issuer https://oidc.vercel.com/<team>, allowed audience https://vercel.com/<team>, and google.subject mapped to assertion.sub. Google said: ${detail}`,
    );
  }
  if (/disabled|has not been used/i.test(detail)) {
    return new AnalyticsError(
      "api-disabled",
      "The IAM Service Account Credentials API is turned off for the Google Cloud project.",
      "Enable “IAM Service Account Credentials API” and “Security Token Service API” in Google Cloud → APIs & Services, then try again.",
    );
  }
  return new AnalyticsError(
    "impersonation",
    `Vercel isn't allowed to act as ${serviceAccountEmail}.`,
    `In Google Cloud → Service accounts → ${serviceAccountEmail} → Principals with access, grant the deployment's principal the “Workload Identity User” role. Google said: ${detail}`,
  );
}

export function classifyGoogleError(httpStatus: number, body: unknown, clientEmail: string): AnalyticsError {
  const b = (body ?? {}) as GoogleErrorBody;

  // OAuth token endpoint errors are flat: { error: "invalid_grant", error_description }.
  if (typeof b.error === "string") {
    return new AnalyticsError(
      "auth",
      "Google rejected the service account key.",
      "Create a new JSON key for the service account in Google Cloud and paste it into GA_SERVICE_ACCOUNT_KEY. The key may have been deleted or rotated.",
    );
  }

  const err = b.error ?? {};
  const status = err.status ?? "";
  const message = err.message ?? "";
  const reasons = (err.details ?? []).map((d) => d.reason ?? "");

  if (reasons.includes("SERVICE_DISABLED") || /has not been used|is disabled/i.test(message)) {
    return new AnalyticsError(
      "api-disabled",
      "The Google Analytics Data API is turned off for this Google Cloud project.",
      "In Google Cloud → APIs & Services → Library, enable “Google Analytics Data API” for the project that owns the service account, then wait a minute and try again.",
    );
  }
  if (httpStatus === 403 || status === "PERMISSION_DENIED") {
    return new AnalyticsError(
      "permission",
      "The service account can't read this Google Analytics property.",
      `In Google Analytics → Admin → Property access management, add ${clientEmail} with the Viewer role.`,
    );
  }
  if (httpStatus === 404 || (httpStatus === 400 && /property/i.test(message))) {
    return new AnalyticsError(
      "property",
      "Google Analytics couldn't find that property.",
      "Check GA4_PROPERTY_ID. It is the number under Admin → Property details, not the G-RQ7LFVTWWW measurement id.",
    );
  }
  if (httpStatus === 429 || status === "RESOURCE_EXHAUSTED") {
    return new AnalyticsError(
      "quota",
      "Google Analytics is limiting requests right now.",
      "The property's hourly reporting quota is used up. Figures are cached for 10 minutes; try again later.",
    );
  }
  if (httpStatus === 401 || status === "UNAUTHENTICATED") {
    return new AnalyticsError(
      "auth",
      "Google didn't accept the admin panel's credentials.",
      "Check that GA_SERVICE_ACCOUNT_KEY holds a current key for the service account.",
    );
  }
  return new AnalyticsError(
    "unknown",
    "Google Analytics returned an unexpected error.",
    message ? `Google said: ${message}` : `HTTP ${httpStatus}. Try again in a moment.`,
  );
}
