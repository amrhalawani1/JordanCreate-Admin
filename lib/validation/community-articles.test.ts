import test from "node:test";
import assert from "node:assert/strict";
import { CommunityArticleSchema } from "./community-articles";
import {
  parseArticleBody,
  parseArticleFaq,
  parseLines,
  serializeArticleBody,
  serializeArticleFaq,
  serializeLines,
  type ArticleBlock,
} from "../articles/text-format";

const base = {
  title: "How creators in Jordan get paid",
  slug: "how-creators-in-jordan-get-paid",
  dek: "Five kinds of income, from least to most reliable.",
  tag: "Business",
  author_name: "Jordan Create",
  author_type: "Organization",
  published_at: "2026-09-08",
  content_updated_at: "",
  cover_url: "https://www.jordancreate.com/assets/gallery/cover.jpg",
  cover_alt: "A creator filming on stage",
  key_takeaways: "Platform payouts are the smallest slice\n- Brand deals pay the bills",
  body: "Intro paragraph\nthat wraps.\n\n## 1. Platform payouts\n\n- one\n- two\n\n> Count it when it arrives.\n> — A creator",
  faq: "Q: Do I need a manager?\nA: No.\n\nQ: How much to charge?\nA: Start from your rate card\nand adjust.",
  keywords: "creator economy; Jordan",
  cta_label: "Buy Tickets",
  cta_href: "https://tzkrti.com/en/events/4825",
  featured: false,
  status: "published",
};

test("parses the text fields into the website's shapes", () => {
  const parsed = CommunityArticleSchema.parse(base);
  assert.deepEqual(parsed.body, [
    { type: "p", text: "Intro paragraph that wraps." },
    { type: "h2", text: "1. Platform payouts" },
    { type: "list", items: ["one", "two"] },
    { type: "quote", text: "Count it when it arrives.", cite: "A creator" },
  ]);
  assert.deepEqual(parsed.faq, [
    { question: "Do I need a manager?", answer: "No." },
    { question: "How much to charge?", answer: "Start from your rate card and adjust." },
  ]);
  assert.deepEqual(parsed.key_takeaways, ["Platform payouts are the smallest slice", "Brand deals pay the bills"]);
  assert.deepEqual(parsed.keywords, ["creator economy", "Jordan"]);
  assert.equal(parsed.content_updated_at, null);
});

test("re-parsing already-parsed values gives the same result (browser then server)", () => {
  const once = CommunityArticleSchema.parse(base);
  const twice = CommunityArticleSchema.parse({ ...once, content_updated_at: once.content_updated_at ?? "" });
  assert.deepEqual(twice, once);
});

test("accepts a site path as the button link", () => {
  const parsed = CommunityArticleSchema.parse({ ...base, cta_href: "/#lineup" });
  assert.equal(parsed.cta_href, "/#lineup");
});

test("allows no button at all, but not half a button", () => {
  const none = CommunityArticleSchema.safeParse({ ...base, cta_label: "", cta_href: "" });
  assert.equal(none.success, true);
  const half = CommunityArticleSchema.safeParse({ ...base, cta_href: "" });
  assert.equal(half.success, false);
});

test("rejects a bad slug, too few takeaways, an empty body and an unanswered question", () => {
  assert.equal(CommunityArticleSchema.safeParse({ ...base, slug: "How Creators" }).success, false);
  assert.equal(CommunityArticleSchema.safeParse({ ...base, key_takeaways: "only one" }).success, false);
  assert.equal(CommunityArticleSchema.safeParse({ ...base, body: "   " }).success, false);
  assert.equal(CommunityArticleSchema.safeParse({ ...base, faq: "Q: Is it free?" }).success, false);
  assert.equal(CommunityArticleSchema.safeParse({ ...base, status: "live" }).success, false);
});

test("an empty FAQ is fine, more than 6 questions is not", () => {
  assert.equal(CommunityArticleSchema.safeParse({ ...base, faq: "" }).success, true);
  const seven = Array.from({ length: 7 }, (_, i) => `Q: q${i}\nA: a${i}`).join("\n\n");
  assert.equal(CommunityArticleSchema.safeParse({ ...base, faq: seven }).success, false);
});

test("body, FAQ and takeaways round-trip through their text form", () => {
  const blocks: ArticleBlock[] = [
    { type: "p", text: "- starts like a list but is a paragraph" },
    { type: "p", text: "## looks like a heading" },
    { type: "h2", text: "A real heading" },
    { type: "list", items: ["a", "b"] },
    { type: "quote", text: "No cite here." },
    { type: "quote", text: "With a cite.", cite: "Someone" },
  ];
  assert.deepEqual(parseArticleBody(serializeArticleBody(blocks)), blocks);
  const faq = [{ question: "Q one?", answer: "A one." }];
  assert.deepEqual(parseArticleFaq(serializeArticleFaq(faq)), faq);
  assert.deepEqual(parseLines(serializeLines(["x", "y"])), ["x", "y"]);
});

