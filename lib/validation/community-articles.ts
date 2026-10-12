import { z } from "zod";
import { ARTICLE_AUTHOR_TYPE_VALUES, ARTICLE_STATUS_VALUES } from "@/types/entities";
import { parseArticleBody, parseArticleFaq, parseLines } from "@/lib/articles/text-format";
import { nullableChipList, nullableText, requiredText, requiredUrl } from "./shared";

/**
 * Community articles (jordancreate.com/community). The form edits the body,
 * FAQ and key takeaways as plain text (see lib/articles/text-format.ts); this
 * schema turns that text into the structured shape the website renders. It
 * also accepts the already-parsed arrays, because the browser validates first
 * and then sends its parsed values to the server action, which parses again.
 * Limits mirror the website's ArticleSchema so a saved article always renders.
 */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const BlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("p"), text: z.string().trim().min(1) }),
  z.object({ type: z.literal("h2"), text: z.string().trim().min(1) }),
  z.object({ type: z.literal("list"), items: z.array(z.string().trim().min(1)).min(1) }),
  z.object({ type: z.literal("quote"), text: z.string().trim().min(1), cite: z.string().trim().min(1).optional() }),
]);

const FaqItemSchema = z.object({
  question: z.string().trim().min(1, { message: "Every FAQ needs a question after \"Q:\"." }),
  answer: z.string().trim().min(1, { message: "Every FAQ question needs an answer on an \"A:\" line." }),
});

const body = z
  .union([z.string(), z.array(z.unknown())])
  .transform((value) => (typeof value === "string" ? parseArticleBody(value) : value))
  .pipe(z.array(BlockSchema).min(1, { message: "Write the article body." }));

const faq = z
  .union([z.string(), z.array(z.unknown())])
  .transform((value) => (typeof value === "string" ? parseArticleFaq(value) : value))
  .pipe(z.array(FaqItemSchema).max(6, { message: "Keep the FAQ to 6 questions or fewer." }));

const keyTakeaways = z
  .union([z.string(), z.array(z.string())])
  .transform((value) => (typeof value === "string" ? parseLines(value) : value.map((v) => v.trim()).filter(Boolean)))
  .pipe(
    z
      .array(z.string())
      .min(2, { message: "Add at least 2 key takeaways, one per line." })
      .max(6, { message: "Keep key takeaways to 6 or fewer." }),
  );

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .refine((v) => v === null || DATE_PATTERN.test(v), { message: "Use a full date." });

/** A link can be a full https:// URL or a path on jordancreate.com such as /#lineup. */
const ctaHref = nullableText().refine(
  (v) => v === null || v.startsWith("/") || z.url({ protocol: /^https?$/ }).safeParse(v).success,
  { message: "Use a full https:// link, or a site path that starts with / (e.g. /#lineup)." },
);

export const CommunityArticleSchema = z
  .object({
    title: requiredText("Title is required."),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(SLUG_PATTERN, {
        message: "Use lowercase words joined by dashes, e.g. how-creators-get-paid.",
      }),
    dek: requiredText("Subtitle is required. It also becomes the search-engine description."),
    tag: requiredText("Topic tag is required (e.g. Business, Craft, Guide)."),
    author_name: requiredText("Author name is required."),
    author_type: z.enum(ARTICLE_AUTHOR_TYPE_VALUES, { error: "Choose Organization or Person." }),
    published_at: z.string().trim().regex(DATE_PATTERN, { message: "Publish date is required." }),
    content_updated_at: optionalDate,
    cover_url: requiredUrl("Cover image is required.", "Upload a cover image or paste its full URL."),
    cover_alt: requiredText("Describe the cover image for screen readers and search engines."),
    key_takeaways: keyTakeaways,
    body,
    faq,
    keywords: nullableChipList().transform((v) => v ?? []),
    cta_label: nullableText(),
    cta_href: ctaHref,
    featured: z.boolean(),
    status: z.enum(ARTICLE_STATUS_VALUES, { error: "Choose draft or published." }),
  })
  .superRefine((value, ctx) => {
    if ((value.cta_label === null) !== (value.cta_href === null)) {
      ctx.addIssue({
        code: "custom",
        path: [value.cta_label === null ? "cta_label" : "cta_href"],
        message: "Fill in both the button label and its link, or leave both empty.",
      });
    }
  });

export type CommunityArticleValues = z.output<typeof CommunityArticleSchema>;

/** What the form holds: the body, FAQ and takeaways as text. */
export type CommunityArticleFormValues = {
  title: string;
  slug: string;
  dek: string;
  tag: string;
  author_name: string;
  author_type: (typeof ARTICLE_AUTHOR_TYPE_VALUES)[number];
  published_at: string;
  content_updated_at: string;
  cover_url: string;
  cover_alt: string;
  key_takeaways: string;
  body: string;
  faq: string;
  keywords: string;
  cta_label: string;
  cta_href: string;
  featured: boolean;
  status: (typeof ARTICLE_STATUS_VALUES)[number];
};

