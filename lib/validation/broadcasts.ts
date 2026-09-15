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
    testPhone: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.audience === "test" && !toE164(value.testPhone ?? "")) {
      ctx.addIssue({ code: "custom", path: ["testPhone"], message: "Enter the phone number of the guest account to test with." });
    }
  });

export type BroadcastFormValues = z.infer<typeof BroadcastSchema>;
