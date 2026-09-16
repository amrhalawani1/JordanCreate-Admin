import assert from "node:assert/strict";
import test from "node:test";
import { EntertainmentSchema } from "./entertainment";

const act = {
  act_type: "DJ" as const,
  title: "Opening Set",
  performer_name: "Playbacks",
  description: null,
  start_time: "20:00",
  end_time: "",
  location_within_venue: null,
  photo_url: "",
  link: "",
  sort_order: 0,
  status: "confirmed" as const,
  interest_tag_ids: ["MUSIC"],
};

test("an act saves with its interest tags", () => {
  const parsed = EntertainmentSchema.safeParse(act);
  assert.equal(parsed.success, true);
  assert.deepEqual(parsed.success && parsed.data.interest_tag_ids, ["MUSIC"]);
});

test("an act needs at least one interest tag", () => {
  const parsed = EntertainmentSchema.safeParse({ ...act, interest_tag_ids: [] });
  assert.equal(parsed.success, false);
  assert.equal(parsed.error?.issues[0]?.message, "Pick at least one interest tag.");
});
