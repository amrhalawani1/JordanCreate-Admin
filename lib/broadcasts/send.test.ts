import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMessages,
  chunk,
  explainSendFailure,
  isExpoPushToken,
  sendToDevices,
  tallyTickets,
  type ExpoMessage,
  type PushTicket,
} from "./send";
import { isBroadcastDestination } from "./deep-links";

const token = (n: number) => `ExponentPushToken[device-${n}]`;
const broadcast = { id: "b1", body: " Doors open in 30 minutes. ", deepLink: "/destination/map" };

function store() {
  const deleted: string[] = [];
  return { deleted, store: { deleteDeviceTokens: async (tokens: string[]) => void deleted.push(...tokens) } };
}

test("messages use the app's Android channel, a trimmed body and the in-app link", () => {
  const [message] = buildMessages(broadcast, [token(1)]);
  assert.equal(message.channelId, "event-updates");
  assert.equal(message.title, "Jordan Create");
  assert.equal(message.body, "Doors open in 30 minutes.");
  assert.deepEqual(message.data, { url: "/destination/map", broadcastId: "b1" });
  assert.deepEqual(buildMessages({ ...broadcast, deepLink: null }, [token(1)])[0].data, { broadcastId: "b1" });
});

test("batches stay within Expo's 100-message limit", () => {
  assert.deepEqual(chunk(Array.from({ length: 250 }, (_, i) => i)).map((part) => part.length), [100, 100, 50]);
});

test("only Expo push tokens are accepted", () => {
  assert.ok(isExpoPushToken("ExponentPushToken[abc]"));
  assert.ok(isExpoPushToken("ExpoPushToken[abc]"));
  assert.ok(!isExpoPushToken("raw-fcm-token"));
});

test("tickets are tallied and unregistered devices collected", () => {
  const messages = buildMessages(broadcast, [token(1), token(2), token(3)]);
  const tickets: PushTicket[] = [
    { status: "ok" },
    { status: "error", details: { error: "DeviceNotRegistered" } },
    { status: "error", details: { error: "MessageRateExceeded" } },
  ];
  assert.deepEqual(tallyTickets(messages, tickets), {
    delivered: 1,
    failed: 2,
    deadTokens: [token(2)],
    lastError: "MessageRateExceeded",
  });
});

test("sends every device across batches, de-duplicates, and removes dead tokens", async () => {
  const tokens = [...Array.from({ length: 230 }, (_, i) => token(i)), token(0), "junk"];
  const { store: s, deleted } = store();
  const batches: number[] = [];
  const transport = async (messages: ExpoMessage[]) => {
    batches.push(messages.length);
    return messages.map((m): PushTicket =>
      m.to === token(5) ? { status: "error", details: { error: "DeviceNotRegistered" } } : { status: "ok" },
    );
  };
  const outcome = await sendToDevices(broadcast, tokens, s, transport);
  assert.deepEqual(batches, [100, 100, 30]);
  assert.deepEqual(outcome, { recipients: 230, delivered: 229, failed: 1, removedTokens: 1, lastError: "DeviceNotRegistered" });
  assert.deepEqual(deleted, [token(5)]);
});

test("a failed request does not stop later batches", async () => {
  let calls = 0;
  const outcome = await sendToDevices(broadcast, Array.from({ length: 150 }, (_, i) => token(i)), store().store, async (m) => {
    calls += 1;
    if (calls === 1) throw new Error("HTTP 503");
    return m.map((): PushTicket => ({ status: "ok" }));
  });
  assert.equal(outcome.delivered, 50);
  assert.equal(outcome.failed, 100);
  assert.equal(outcome.lastError, "HTTP 503");
});

test("missing Firebase credentials get an actionable explanation", async () => {
  const outcome = await sendToDevices(broadcast, [token(1)], store().store, async () => [
    { status: "error", message: "Unable to retrieve the FCM server key", details: { error: "InvalidCredentials" } },
  ]);
  assert.equal(outcome.delivered, 0);
  assert.match(explainSendFailure(outcome.lastError), /Firebase key/);
});

test("broadcast links are limited to known app screens", () => {
  assert.ok(isBroadcastDestination("/agenda"));
  assert.ok(isBroadcastDestination(""));
  assert.ok(!isBroadcastDestination("https://example.com"));
});
