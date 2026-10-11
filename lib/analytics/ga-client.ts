import "server-only";

import { createSign } from "node:crypto";
import { getVercelOidcToken } from "@vercel/oidc";
import { authEmail, type AnalyticsAuth, type AnalyticsConfig } from "./config";
import { AnalyticsError, classifyFederationError, classifyGoogleError } from "./errors";
import type { GaReport } from "./parse";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const STS_URL = "https://sts.googleapis.com/v1/token";
const IAM_CREDENTIALS = "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts";
const DATA_API = "https://analyticsdata.googleapis.com/v1beta";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

let token: { value: string; expiresAt: number; email: string } | null = null;

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

async function accessToken(config: AnalyticsConfig): Promise<string> {
  const email = authEmail(config.auth);
  if (token && token.email === email && token.expiresAt > Date.now() + 60_000) return token.value;
  const fresh = config.auth.kind === "federated" ? await federatedToken(config.auth) : await keyFileToken(config.auth);
  token = { ...fresh, email };
  return fresh.value;
}

/**
 * Keyless: this Vercel deployment's OIDC identity token is exchanged at
 * Google's Security Token Service for a federated token, which then asks IAM
 * for a one-hour access token as the read-only service account.
 */
async function federatedToken(auth: Extract<AnalyticsAuth, { kind: "federated" }>) {
  let subjectToken: string;
  try {
    subjectToken = await getVercelOidcToken();
  } catch {
    throw new AnalyticsError(
      "local",
      "Live Google Analytics data is only available on the deployed admin.",
      "Keyless access uses the Vercel deployment's identity, which local development doesn't have. Open admin.jordancreate.com, or use the sample preview here.",
    );
  }

  const exchange = await safeFetch(STS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      audience: `//iam.googleapis.com/${auth.providerResource}`,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      subject_token: subjectToken,
    }),
  });
  const exchanged = await exchange.json().catch(() => ({}));
  if (!exchange.ok || typeof exchanged.access_token !== "string") {
    throw classifyFederationError("exchange", exchange.status, exchanged, auth.serviceAccountEmail);
  }

  const impersonate = await safeFetch(`${IAM_CREDENTIALS}/${encodeURIComponent(auth.serviceAccountEmail)}:generateAccessToken`, {
    method: "POST",
    headers: { Authorization: `Bearer ${exchanged.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ scope: [SCOPE], lifetime: "3600s" }),
  });
  const granted = await impersonate.json().catch(() => ({}));
  if (!impersonate.ok || typeof granted.accessToken !== "string") {
    throw classifyFederationError("impersonate", impersonate.status, granted, auth.serviceAccountEmail);
  }
  const expiresAt = Date.parse(granted.expireTime);
  return { value: granted.accessToken as string, expiresAt: Number.isFinite(expiresAt) ? expiresAt : Date.now() + 3_000_000 };
}

/** Key file: service-account OAuth (JWT bearer grant), signed locally with node:crypto. */
async function keyFileToken(auth: Extract<AnalyticsAuth, { kind: "key" }>) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({ iss: auth.clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
  );
  let signature: string;
  try {
    signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(auth.privateKey, "base64url");
  } catch {
    throw new AnalyticsError(
      "auth",
      "The service account private key could not be used.",
      "GA_SERVICE_ACCOUNT_KEY looks damaged. Paste the JSON key file again exactly as downloaded.",
    );
  }

  const res = await safeFetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || typeof body.access_token !== "string") throw classifyGoogleError(res.status, body, auth.clientEmail);
  return { value: body.access_token as string, expiresAt: Date.now() + (Number(body.expires_in) || 3600) * 1000 };
}

async function safeFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(15_000) });
  } catch {
    throw new AnalyticsError(
      "network",
      "Google Analytics could not be reached.",
      "Check the server's internet connection and try again.",
    );
  }
}

async function post<T>(config: AnalyticsConfig, method: string, body: unknown): Promise<T> {
  const bearer = await accessToken(config);
  const res = await safeFetch(`${DATA_API}/properties/${config.propertyId}:${method}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) token = null;
    throw classifyGoogleError(res.status, json, authEmail(config.auth));
  }
  return json as T;
}

/** Up to five reports in one round trip. */
export async function batchRunReports(config: AnalyticsConfig, requests: object[]): Promise<GaReport[]> {
  const res = await post<{ reports?: GaReport[] }>(config, "batchRunReports", { requests });
  return res.reports ?? [];
}

export async function runRealtimeReport(config: AnalyticsConfig, request: object): Promise<GaReport> {
  return post<GaReport>(config, "runRealtimeReport", request);
}
