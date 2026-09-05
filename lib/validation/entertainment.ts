import { z } from "zod";
import { requiredText, nullableText, optionalUrl } from "./shared";
import { ENTERTAINMENT_ACT_TYPE_VALUES, ENTERTAINMENT_STATUS_VALUES } from "@/types/entities";

function nullableTime() {
  return z
    .union([z.string(), z.null()])
    .transform((v) => (typeof v === "string" && v.trim() === "" ? null : v));
}

export const EntertainmentSchema = z.object({
  act_type: z.enum(ENTERTAINMENT_ACT_TYPE_VALUES),
  title: requiredText("Title is required."),
  performer_name: nullableText(),
  description: nullableText(),
  start_time: nullableTime(),
  end_time: nullableTime(),
  location_within_venue: nullableText(),
  photo_url: optionalUrl(),
  link: optionalUrl(),
  sort_order: z.number({ error: "Sort order is required." }).int(),
  status: z.enum(ENTERTAINMENT_STATUS_VALUES),
});

export type EntertainmentFormValues = z.infer<typeof EntertainmentSchema>;
