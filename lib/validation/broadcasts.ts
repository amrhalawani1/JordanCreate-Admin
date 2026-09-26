import { z } from "zod";
import { MAX_BROADCAST_LENGTH } from "@/lib/broadcasts/send";
import { isBroadcastDestination } from "@/lib/broadcasts/deep-links";
import { toE164 } from "@/lib/phone";

export const BroadcastSchema = z
  .object({
    body: z
      .string()
      .trim()
      .min(1, "Write the message guests will see.")
      .max(MAX_BROADCAST_LENGTH, `Keep it to ${MAX_BROADCAST_LENGTH} characters so it fits on a lock screen.`),
    deepLink: z.string().refine(isBroadcastDestination, "Pick a screen from the list."),
    audience: z.enum(["all", "test"]),
    /** Email or phone number of the guest account that receives a test. Guests sign in with email, so most tests use it. */
    testRecipient: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.audience === "test" && !parseTestRecipient(value.testRecipient ?? "")) {
      ctx.addIssue({
        code: "custom",
        path: ["testRecipient"],
        message: "Enter the email or phone number of the guest account to test with.",
      });
    }
  });

export type TestRecipient = { kind: "email"; email: string } | { kind: "phone"; phone: string };

/** Reads the test field as an email (anything with an @) or a phone number in any common format. */
export function parseTestRecipient(raw: string): TestRecipient | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.includes("@")) {
    return z.string().email().safeParse(value).success ? { kind: "email", email: value.toLowerCase() } : null;
  }
  const phone = toE164(value);
  return phone ? { kind: "phone", phone } : null;
}

export type BroadcastFormValues = z.infer<typeof BroadcastSchema>;
