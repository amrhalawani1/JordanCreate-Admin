import { z } from "zod";
import { requiredText, nullableText, optionalUrl } from "./shared";

export const PartnerSchema = z.object({
  name: requiredText("Name is required."),
  tier: requiredText("Tier is required."),
  zone_id: z
    .union([z.string(), z.null()])
    .transform((v) => (typeof v === "string" && v.trim() === "" ? null : v)),
  description: nullableText(),
  website: optionalUrl(),
  image_url: optionalUrl(),
  sort_order: z.number({ error: "Sort order is required." }).int(),
});

export type PartnerFormValues = z.infer<typeof PartnerSchema>;
