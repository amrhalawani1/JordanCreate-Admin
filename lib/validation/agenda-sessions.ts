import { z } from "zod";
import { requiredText, nullableText } from "./shared";
import { AGENDA_STATUS_VALUES } from "@/types/entities";

export const AgendaSessionSchema = z.object({
  session_id: requiredText("Session ID is required."),
  start_time: requiredText("Start time is required."),
  end_time: requiredText("End time is required."),
  session_type: requiredText("Session type is required."),
  title: requiredText("Title is required."),
  description: nullableText(),
  speaker_handles: z.array(z.string()),
  moderator_handle: z.string().nullable(),
  duration_minutes: z.number({ error: "Duration is required." }).int().nonnegative(),
  interest_tag_ids: z.array(z.string()),
  location_within_venue: nullableText(),
  status: z.enum(AGENDA_STATUS_VALUES),
  flag_notes: nullableText(),
  sort_order: z.number({ error: "Sort order is required." }).int(),
});

export type AgendaSessionFormValues = z.infer<typeof AgendaSessionSchema>;
