// Sends one admin broadcast to guest phones through the Expo push service,
// which relays to Firebase Cloud Messaging (Android) and APNs (iOS).
// Pure logic with injected storage and transport so it runs under node:test.

export const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
/** Expo accepts at most 100 messages per request. */
export const EXPO_BATCH_SIZE = 100;
/** Android channel the guest app creates (see the app's native adapters). */
export const ANDROID_CHANNEL_ID = "event-updates";
export const NOTIFICATION_TITLE = "Jordan Create";
export const MAX_BROADCAST_LENGTH = 178;

export type PushTicket =
  | { status: "ok"; id?: string }
  | { status: "error"; message?: string; details?: { error?: string } };

export type ExpoMessage = {
  to: string;
  title: string;
  body: string;
  sound: "default";
  priority: "high";
  channelId: string;
  data: { url?: string; broadcastId: string };
};

export type BroadcastToSend = { id: string; body: string; deepLink: string | null };

export type SendStore = {
  deleteDeviceTokens(tokens: string[]): Promise<void>;
};

export type PushTransport = (messages: ExpoMessage[]) => Promise<PushTicket[]>;

export type SendOutcome = {
  recipients: number;
  delivered: number;
  failed: number;
  removedTokens: number;
  /** Last transport error, e.g. missing Firebase credentials on Expo. */
  lastError?: string;
};

export function isExpoPushToken(token: string): boolean {
  return /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token.trim());
}

export function chunk<T>(items: T[], size = EXPO_BATCH_SIZE): T[][] {
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size) out.push(items.slice(index, index + size));
  return out;
}

export function uniquePushTokens(tokens: string[]): string[] {
  return [...new Set(tokens.map((token) => token.trim()))].filter(isExpoPushToken);
}

export function buildMessages(broadcast: BroadcastToSend, tokens: string[]): ExpoMessage[] {
  const body = broadcast.body.trim();
  const url = broadcast.deepLink?.trim() || undefined;
  return tokens.map((to) => ({
    to,
    title: NOTIFICATION_TITLE,
    body,
    sound: "default",
    priority: "high",
    channelId: ANDROID_CHANNEL_ID,
    data: { ...(url ? { url } : {}), broadcastId: broadcast.id },
  }));
}

/** Expo returns one ticket per message, in the same order. */
export function tallyTickets(messages: ExpoMessage[], tickets: PushTicket[]) {
  let delivered = 0;
  let failed = 0;
  const deadTokens: string[] = [];
  let lastError: string | undefined;
  messages.forEach((message, index) => {
    const ticket = tickets[index];
    if (ticket?.status === "ok") {
      delivered += 1;
      return;
    }
    failed += 1;
    if (ticket?.status === "error") {
      lastError = ticket.details?.error ?? ticket.message ?? lastError;
      if (ticket.details?.error === "DeviceNotRegistered") deadTokens.push(message.to);
    }
  });
  return { delivered, failed, deadTokens, lastError };
}

export async function sendToDevices(
  broadcast: BroadcastToSend,
  tokens: string[],
  store: SendStore,
  transport: PushTransport,
): Promise<SendOutcome> {
  const unique = uniquePushTokens(tokens);
  let delivered = 0;
  let failed = 0;
  let lastError: string | undefined;
  const deadTokens: string[] = [];

  for (const batch of chunk(buildMessages(broadcast, unique))) {
    try {
      const tally = tallyTickets(batch, await transport(batch));
      delivered += tally.delivered;
      failed += tally.failed;
      deadTokens.push(...tally.deadTokens);
      lastError = tally.lastError ?? lastError;
    } catch (error) {
      // One failed request must not stop the rest of the audience.
      failed += batch.length;
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  if (deadTokens.length) await store.deleteDeviceTokens(deadTokens);
  return { recipients: unique.length, delivered, failed, removedTokens: deadTokens.length, ...(lastError ? { lastError } : {}) };
}

/** Plain-language reason for the admin when nothing was delivered. */
export function explainSendFailure(lastError: string | undefined): string {
  if (!lastError) return "No phones accepted the notification.";
  if (/InvalidCredentials|FCM|credentials/i.test(lastError)) {
    return "Expo has no Firebase key for the app. Upload the FCM V1 service account key with `eas credentials`, then send again.";
  }
  if (/MessageRateExceeded|429/.test(lastError)) return "Expo is rate limiting sends. Wait a minute and send again.";
  if (/DeviceNotRegistered/.test(lastError)) return "Those phones no longer have the app or turned notifications off.";
  return `Expo refused the send: ${lastError}`;
}

export async function expoTransport(messages: ExpoMessage[], accessToken?: string): Promise<PushTicket[]> {
  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(messages),
  });
  const payload = (await response.json().catch(() => null)) as
    | { data?: PushTicket[]; errors?: { code?: string; message?: string }[] }
    | null;
  if (!response.ok || !Array.isArray(payload?.data)) {
    const first = payload?.errors?.[0];
    throw new Error(first?.code ?? first?.message ?? `HTTP ${response.status}`);
  }
  return payload.data;
}
