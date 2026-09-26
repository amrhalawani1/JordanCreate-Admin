import test from "node:test";
import assert from "node:assert/strict";
import { HotTopicSchema } from "./hot-topics";

const base = {
  eyebrow: "DJ",
  headline: "Dopamine",
  supporting: "Dopamine — 04:00 PM – 05:30 PM.",
  action_label: "See the session",
  destination: "entertainment-2",
  image_url: "https://example.test/dopamine.jpg",
  sort_order: 0,
  status: "published",
};

test("accepts an in-app destination and stores blanks as null", () => {
  const parsed = HotTopicSchema.parse({ ...base, supporting: "  ", image_url: "" });
  assert.equal(parsed.supporting, null);
  assert.equal(parsed.image_url, null);
  assert.equal(parsed.destination, "entertainment-2");
});

test("rejects a URL as a destination", () => {
  const result = HotTopicSchema.safeParse({ ...base, destination: "https://example.test" });
  assert.equal(result.success, false);
});

test("rejects an unknown status", () => {
  const result = HotTopicSchema.safeParse({ ...base, status: "live" });
  assert.equal(result.success, false);
});
