/**
 * Hand-written to match the exact shape `supabase gen types typescript` would
 * produce for project `peaoiihysmthpzrxlcxc`. Only tables this app is allowed
 * to touch are declared here — `guest_profiles` and `conversation_messages`
 * are deliberately absent so nothing in this codebase can reference them.
 *
 * If you later run `supabase gen types typescript --project-id peaoiihysmthpzrxlcxc`,
 * the generated file can replace this one as long as it still exports a
 * `Database` type with this shape — types/entities.ts and everything
 * downstream needs no changes.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      event_info: {
        Row: {
          id: number;
          event_name: string;
          event_date: string;
          doors_open_time: string;
          estimated_end_time: string;
          venue_name: string;
          venue_address: string;
          google_maps_link: string | null;
          dress_code: string;
          weather_notes: string;
          guest_count: number;
          rsvp_link: string;
          parking_info: string;
          wifi_network: string;
          wifi_password: string | null;
          prayer_space_info: string;
          emergency_contact: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["event_info"]["Row"]>;
        Update: Partial<Omit<Database["public"]["Tables"]["event_info"]["Row"], "id">>;
      };
      agenda_sessions: {
        Row: {
          session_id: string;
          start_time: string;
          end_time: string;
          session_type: string;
          title: string;
          description: string | null;
          speaker_handles: string[];
          moderator_handle: string | null;
          duration_minutes: number;
          interest_tag_ids: string[] | null;
          location_within_venue: string | null;
          status: "draft" | "confirmed";
          flag_notes: string | null;
          sort_order: number;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["agenda_sessions"]["Row"], "updated_at">;
        Update: Partial<
          Omit<Database["public"]["Tables"]["agenda_sessions"]["Row"], "session_id">
        >;
      };
      speakers: {
        Row: {
          handle: string;
          tagline: string | null;
          category: string | null;
          followers_range: string | null;
          known_for: string | null;
          availability: string | null;
          bio_status: "confirmed" | "missing" | "unconfirmed";
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["speakers"]["Row"], "updated_at">;
        Update: Partial<Omit<Database["public"]["Tables"]["speakers"]["Row"], "handle">>;
      };
      venue_zones: {
        Row: {
          zone_id: string;
          name: string;
          capacity_note: string | null;
          details: string | null;
        };
        Insert: Database["public"]["Tables"]["venue_zones"]["Row"];
        Update: Partial<Omit<Database["public"]["Tables"]["venue_zones"]["Row"], "zone_id">>;
      };
      interest_tags: {
        Row: {
          tag_id: string;
          tag_label: string;
          tag_description: string | null;
          is_provisional: boolean;
        };
        Insert: Database["public"]["Tables"]["interest_tags"]["Row"];
        Update: Partial<Omit<Database["public"]["Tables"]["interest_tags"]["Row"], "tag_id">>;
      };
      brand_voice: {
        Row: {
          id: number;
          mission: string;
          values_text: string;
          tone_notes: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["brand_voice"]["Row"]>;
        Update: Partial<Omit<Database["public"]["Tables"]["brand_voice"]["Row"], "id">>;
      };
      faq_entries: {
        Row: {
          id: number;
          question: string;
          answer: string;
          sort_order: number;
        };
        Insert: Omit<Database["public"]["Tables"]["faq_entries"]["Row"], "id"> & { id?: number };
        Update: Partial<Omit<Database["public"]["Tables"]["faq_entries"]["Row"], "id">>;
      };
      experience: {
        Row: {
          id: number;
          experience_type: string;
          title: string;
          description: string | null;
          link: string | null;
          platform: string | null;
          usage_context: string | null;
          sort_order: number;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["experience"]["Row"], "id" | "updated_at"> & {
          id?: number;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["experience"]["Row"], "id">>;
      };
      jordan_create_one: {
        Row: {
          id: number;
          name: string;
          status: string;
          notes: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["jordan_create_one"]["Row"]>;
        Update: Partial<Omit<Database["public"]["Tables"]["jordan_create_one"]["Row"], "id">>;
      };
      jordan_create_three: {
        Row: {
          id: number;
          name: string;
          status: string;
          notes: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["jordan_create_three"]["Row"]>;
        Update: Partial<Omit<Database["public"]["Tables"]["jordan_create_three"]["Row"], "id">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
