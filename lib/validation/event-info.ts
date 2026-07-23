import { z } from "zod";
import { requiredText, nullableText } from "./shared";

export const EventInfoSchema = z.object({
  event_name: requiredText("Event name is required."),
  event_date: requiredText("Event date is required."),
  doors_open_time: requiredText("Doors open time is required."),
  estimated_end_time: requiredText("Estimated end time is required."),
  venue_name: requiredText("Venue name is required."),
  venue_address: requiredText("Venue address is required."),
  google_maps_link: nullableText(),
  dress_code: requiredText("Dress code is required."),
  weather_notes: requiredText("Weather notes are required."),
  guest_count: z.number({ error: "Guest count is required." }).int().nonnegative(),
  rsvp_link: requiredText("RSVP link is required."),
  parking_info: requiredText("Parking info is required."),
  wifi_network: requiredText("WiFi network is required."),
  wifi_password: nullableText(),
  prayer_space_info: requiredText("Prayer space info is required."),
  emergency_contact: requiredText("Emergency contact is required."),
});

export type EventInfoFormValues = z.infer<typeof EventInfoSchema>;
