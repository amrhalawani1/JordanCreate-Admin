import type { Database } from "./database";

type Tables = Database["public"]["Tables"];

export type EventInfo = Tables["event_info"]["Row"];
export type EventInfoUpdate = Tables["event_info"]["Update"];

export type EventInfoItem = Tables["event_info_items"]["Row"];
export type EventInfoItemInsert = Tables["event_info_items"]["Insert"];
export type EventInfoItemUpdate = Tables["event_info_items"]["Update"];

export type AgendaSession = Tables["agenda_sessions"]["Row"];
export type AgendaSessionInsert = Tables["agenda_sessions"]["Insert"];
export type AgendaSessionUpdate = Tables["agenda_sessions"]["Update"];

export type Speaker = Tables["speakers"]["Row"];
export type SpeakerInsert = Tables["speakers"]["Insert"];
export type SpeakerUpdate = Tables["speakers"]["Update"];

export type SpeakerSocialLink = Tables["speaker_social_links"]["Row"];
export type SpeakerSocialLinkInsert = Tables["speaker_social_links"]["Insert"];
export type SpeakerSocialLinkUpdate = Tables["speaker_social_links"]["Update"];

export type GuestProfile = Tables["guest_profiles"]["Row"];
export type GuestProfileInsert = Tables["guest_profiles"]["Insert"];
export type GuestProfileUpdate = Tables["guest_profiles"]["Update"];

export type GuestSocialLink = Tables["guest_social_links"]["Row"];
export type GuestSocialLinkInsert = Tables["guest_social_links"]["Insert"];
export type GuestSocialLinkUpdate = Tables["guest_social_links"]["Update"];

export type Partner = Tables["partners"]["Row"];
export type PartnerInsert = Tables["partners"]["Insert"];
export type PartnerUpdate = Tables["partners"]["Update"];

export type Entertainment = Tables["entertainment"]["Row"];
export type EntertainmentInsert = Tables["entertainment"]["Insert"];
export type EntertainmentUpdate = Tables["entertainment"]["Update"];

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

export const ENTERTAINMENT_ACT_TYPE_VALUES = [
  "DJ",
  "Magic Show",
  "Live Performance",
  "Band",
  "Other",
] as const;
export type EntertainmentActType = (typeof ENTERTAINMENT_ACT_TYPE_VALUES)[number];

export const ENTERTAINMENT_STATUS_VALUES = ["draft", "confirmed"] as const;
export type EntertainmentStatus = (typeof ENTERTAINMENT_STATUS_VALUES)[number];

export const SPEAKER_BIO_STATUS_VALUES = ["confirmed", "missing", "unconfirmed"] as const;
export type SpeakerBioStatus = (typeof SPEAKER_BIO_STATUS_VALUES)[number];

export const SOCIAL_PLATFORM_VALUES = [
  "Instagram",
  "LinkedIn",
  "Behance",
  "Website",
  "TikTok",
  "Facebook",
  "Snapchat",
  "Other",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORM_VALUES)[number];

export type SocialLinkDraft = {
  platform: SocialPlatform;
  handle: string;
  url: string;
};

export type Admin = Tables["admins"]["Row"];
export type AdminInsert = Tables["admins"]["Insert"];
export type AdminUpdate = Tables["admins"]["Update"];

export const ADMIN_LEVEL_VALUES = ["super_admin", "admin", "admin_view_only", "guest_manager"] as const;
export type AdminLevel = (typeof ADMIN_LEVEL_VALUES)[number];

export const ADMIN_LEVEL_LABELS: Record<AdminLevel, string> = {
  super_admin: "Super Admin",
  admin: "Admin - Full Edit",
  admin_view_only: "Admin - View Only",
  guest_manager: "Guest Manager",
};

export type FeatureRequest = Tables["feature_requests"]["Row"];
export type FeatureRequestInsert = Tables["feature_requests"]["Insert"];
export type FeatureRequestUpdate = Tables["feature_requests"]["Update"];

export type FeatureRequestListItem = FeatureRequest & {
  requester_name: string;
  requester_email: string;
};

export type ChangeLog = Tables["change_logs"]["Row"];
export type ChangeLogInsert = Tables["change_logs"]["Insert"];

export const CHANGE_ACTION_VALUES = ["create", "update", "delete", "reorder"] as const;
export type ChangeAction = (typeof CHANGE_ACTION_VALUES)[number];

export const CHANGE_ACTION_LABELS: Record<ChangeAction, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  reorder: "Reordered",
};
