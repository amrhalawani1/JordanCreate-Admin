import { z } from "zod";
import { requiredText, requiredUrl } from "./shared";

export const PartnerSchema = z.object({
  name: requiredText("Name is required."),
  tier: requiredText("Tier is required."),
  zone_id: z
    .union([z.string(), z.null()])
    .transform((v) => (typeof v === "string" && v.trim() === "" ? null : v)),
  description: requiredText("Description is required."),
  website: requiredUrl("Website is required."),
  image_url: requiredUrl("Image is required."),
  sort_order: z.number({ error: "Sort order is required." }).int(),
});

export type PartnerFormValues = z.infer<typeof PartnerSchema>;
