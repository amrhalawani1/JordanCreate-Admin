import { z } from "zod";
import { requiredText, nullableText } from "./shared";

export const VenueZoneSchema = z.object({
  zone_id: requiredText("Zone ID is required."),
  name: requiredText("Name is required."),
  capacity_note: nullableText(),
  details: nullableText(),
});

export type VenueZoneFormValues = z.infer<typeof VenueZoneSchema>;
