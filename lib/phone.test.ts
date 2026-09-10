import assert from "node:assert/strict";
import test from "node:test";
import { phoneMatchesQuery, toE164 } from "./phone";

test("normalises a local Jordan number to E.164", () => {
  assert.equal(toE164("0779453525"), "+962779453525");
  assert.equal(toE164("+962779453525"), "+962779453525");
});

test("phone search matches local digits to a stored E.164 number", () => {
  assert.equal(phoneMatchesQuery("+962779453525", "0779453525"), true);
  assert.equal(phoneMatchesQuery("+962779453525", "779453525"), true);
  assert.equal(phoneMatchesQuery("+14155552671", "4155552671"), true);
  assert.equal(phoneMatchesQuery("+962779453525", "0790000000"), false);
});
