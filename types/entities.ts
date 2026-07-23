import type { Database } from "./database";

type Tables = Database["public"]["Tables"];

export type EventInfo = Tables["event_info"]["Row"];
export type EventInfoUpdate = Tables["event_info"]["Update"];

export type AgendaSession = Tables["agenda_sessions"]["Row"];
export type AgendaSessionInsert = Tables["agenda_sessions"]["Insert"];
export type AgendaSessionUpdate = Tables["agenda_sessions"]["Update"];

export type Speaker = Tables["speakers"]["Row"];
export type SpeakerInsert = Tables["speakers"]["Insert"];
export type SpeakerUpdate = Tables["speakers"]["Update"];

export type VenueZone = Tables["venue_zones"]["Row"];
export type VenueZoneInsert = Tables["venue_zones"]["Insert"];
export type VenueZoneUpdate = Tables["venue_zones"]["Update"];

export type InterestTag = Tables["interest_tags"]["Row"];
export type InterestTagInsert = Tables["interest_tags"]["Insert"];
export type InterestTagUpdate = Tables["interest_tags"]["Update"];

export type BrandVoice = Tables["brand_voice"]["Row"];
export type BrandVoiceUpdate = Tables["brand_voice"]["Update"];

export type FaqEntry = Tables["faq_entries"]["Row"];
export type FaqEntryInsert = Tables["faq_entries"]["Insert"];
export type FaqEntryUpdate = Tables["faq_entries"]["Update"];

export type Experience = Tables["experience"]["Row"];
export type ExperienceInsert = Tables["experience"]["Insert"];
export type ExperienceUpdate = Tables["experience"]["Update"];

export type JordanCreateOne = Tables["jordan_create_one"]["Row"];
export type JordanCreateOneUpdate = Tables["jordan_create_one"]["Update"];

export type JordanCreateThree = Tables["jordan_create_three"]["Row"];
export type JordanCreateThreeUpdate = Tables["jordan_create_three"]["Update"];

// The two Postgres CHECK-constrained enum columns. UI dropdowns and zod
// schemas both derive from these so an invalid value can never be submitted.
export const AGENDA_STATUS_VALUES = ["draft", "confirmed"] as const;
export type AgendaStatus = (typeof AGENDA_STATUS_VALUES)[number];

export const SPEAKER_BIO_STATUS_VALUES = ["confirmed", "missing", "unconfirmed"] as const;
export type SpeakerBioStatus = (typeof SPEAKER_BIO_STATUS_VALUES)[number];
