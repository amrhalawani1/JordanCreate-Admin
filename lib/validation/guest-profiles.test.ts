import test from "node:test";
import assert from "node:assert/strict";
import { GuestProfileSchema } from "./guest-profiles";

const base = {
  guest_id: "",
  guest_name: "Amr Halawani",
  email: "amr@example.test",
  phone_number: "+962790000000",
  birthdate: "1996-04-12",
  gender: "male",
  country: "jo",
  stated_interests: "MUSIC; ART",
  arrival_status: "not_arrived",
  vip_flag: false,
  role: "the illusionist",
  bio: "",
  photo_url: "",
  location: "",
  slug: "AmrHalawani",
  manychat_subscriber_id: "",
  attended_jc1: true,
  attended_jc2: false,
};

test("normalises country and handle, and stores blanks as null", () => {
  const parsed = GuestProfileSchema.parse(base);
  assert.equal(parsed.country, "JO");
  assert.equal(parsed.slug, "amrhalawani");
  assert.equal(parsed.bio, null);
  assert.equal(parsed.manychat_subscriber_id, null);
  assert.deepEqual(parsed.stated_interests, ["MUSIC", "ART"]);
});

test("allows every optional field to be blank", () => {
  const parsed = GuestProfileSchema.parse({ ...base, email: "", birthdate: "", gender: "", country: "", slug: "" });
  assert.equal(parsed.email, null);
  assert.equal(parsed.birthdate, null);
  assert.equal(parsed.gender, null);
  assert.equal(parsed.country, null);
  assert.equal(parsed.slug, null);
});

test("rejects a malformed email, birthdate, gender, and country", () => {
  assert.equal(GuestProfileSchema.safeParse({ ...base, email: "not-an-email" }).success, false);
  assert.equal(GuestProfileSchema.safeParse({ ...base, birthdate: "12/04/1996" }).success, false);
  assert.equal(GuestProfileSchema.safeParse({ ...base, gender: "other" }).success, false);
  assert.equal(GuestProfileSchema.safeParse({ ...base, country: "Jordan" }).success, false);
});
