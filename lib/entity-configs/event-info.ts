import type { FieldConfig } from "./types";
import type { EventInfo } from "@/types/entities";

export const eventInfoFields: FieldConfig<EventInfo>[] = [
  { name: "event_name", label: "Event Name", type: "text", required: true },
  { name: "event_date", label: "Event Date", type: "date", required: true },
  { name: "doors_open_time", label: "Doors Open Time", type: "time", required: true },
  { name: "estimated_end_time", label: "Estimated End Time", type: "time", required: true },
  { name: "venue_name", label: "Venue Name", type: "text", required: true },
  { name: "venue_address", label: "Venue Address", type: "textarea", required: true },
  {
    name: "google_maps_link",
    label: "Google Maps Link",
    type: "url",
    helpText: "Often TBD — leave blank until confirmed.",
  },
  { name: "dress_code", label: "Dress Code", type: "text", required: true },
  { name: "weather_notes", label: "Weather Notes", type: "textarea", required: true },
  { name: "guest_count", label: "Guest Count", type: "number", required: true },
  { name: "rsvp_link", label: "RSVP Link", type: "url", required: true },
  { name: "parking_info", label: "Parking Info", type: "textarea", required: true },
  { name: "wifi_network", label: "WiFi Network", type: "text", required: true },
  {
    name: "wifi_password",
    label: "WiFi Password",
    type: "text",
    helpText: "Often “TBD” until confirmed.",
  },
  { name: "prayer_space_info", label: "Prayer Space Info", type: "textarea", required: true },
  { name: "emergency_contact", label: "Emergency Contact", type: "text", required: true },
];
