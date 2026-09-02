/**
 * Hand-written to match the exact shape `supabase gen types typescript` would
 * produce for project `peaoiihysmthpzrxlcxc`. Only tables this app is allowed
 * to touch are declared here — `conversation_messages` stays absent so
 * nothing in this codebase can reference chat logs.
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
        Relationships: [];
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
      event_info_items: {
        Relationships: [];
        Row: {
          id: number;
          title: string;
          description: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["event_info_items"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["event_info_items"]["Row"], "id">>;
      };
      agenda_sessions: {
        Relationships: [];
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
        Relationships: [];
        Row: {
          handle: string;
          tagline: string | null;
          category: string | null;
          followers_range: string | null;
          known_for: string | null;
          availability: string | null;
          bio_status: "confirmed" | "missing" | "unconfirmed";
          photo_url: string | null;
          tags: string[] | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["speakers"]["Row"], "updated_at">;
        Update: Partial<Omit<Database["public"]["Tables"]["speakers"]["Row"], "handle">>;
      };
      speaker_social_links: {
        Relationships: [];
        Row: {
          id: number;
          speaker_handle: string;
          platform: string;
          handle: string;
          url: string;
          sort_order: number;
        };
        Insert: Omit<Database["public"]["Tables"]["speaker_social_links"]["Row"], "id"> & {
          id?: number;
          sort_order?: number;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["speaker_social_links"]["Row"], "id">>;
      };
      guest_profiles: {
        Relationships: [];
        Row: {
          guest_id: string;
          channel: string;
          channel_identifier: string;
          guest_name: string | null;
          stated_interests: string[] | null;
          arrival_status: string | null;
          last_interaction_time: string | null;
          vip_flag: boolean | null;
          created_at: string | null;
          role: string | null;
          bio: string | null;
          photo_url: string | null;
          location: string | null;
          display_name_arabic: string | null;
          phone_number: string | null;
          attended_jc1: boolean;
          attended_jc2: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["guest_profiles"]["Row"], "created_at" | "last_interaction_time"> & {
          created_at?: string | null;
          last_interaction_time?: string | null;
          guest_name?: string | null;
          stated_interests?: string[] | null;
          arrival_status?: string | null;
          vip_flag?: boolean | null;
          role?: string | null;
          bio?: string | null;
          photo_url?: string | null;
          location?: string | null;
          display_name_arabic?: string | null;
          phone_number?: string | null;
          attended_jc1?: boolean;
          attended_jc2?: boolean;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["guest_profiles"]["Row"], "guest_id">>;
      };
      guest_social_links: {
        Relationships: [];
        Row: {
          id: number;
          guest_id: string;
          platform: string;
          handle: string;
          url: string;
          sort_order: number;
        };
        Insert: Omit<Database["public"]["Tables"]["guest_social_links"]["Row"], "id"> & {
          id?: number;
          sort_order?: number;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["guest_social_links"]["Row"], "id">>;
      };
      partners: {
        Relationships: [];
        Row: {
          id: number;
          name: string;
          tier: string;
          zone_id: string | null;
          description: string | null;
          website: string | null;
          image_url: string | null;
          sort_order: number;
        };
        Insert: Omit<Database["public"]["Tables"]["partners"]["Row"], "id"> & {
          id?: number;
          sort_order?: number;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["partners"]["Row"], "id">>;
      };
      venue_zones: {
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
      admins: {
        Relationships: [];
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          role: string;
          admin_level: "super_admin" | "admin" | "guest_manager";
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["admins"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["admins"]["Row"], "id">>;
      };
      feature_requests: {
        Relationships: [];
        Row: {
          id: string;
          title: string;
          description: string;
          requested_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          requested_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["feature_requests"]["Row"], "id">>;
      };
      change_logs: {
        Relationships: [];
        Row: {
          id: string;
          created_at: string;
          actor_id: string | null;
          actor_name: string;
          actor_email: string;
          action: "create" | "update" | "delete" | "reorder";
          table_name: string;
          record_id: string | null;
          summary: string;
          changes: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          actor_id?: string | null;
          actor_name: string;
          actor_email: string;
          action: "create" | "update" | "delete" | "reorder";
          table_name: string;
          record_id?: string | null;
          summary: string;
          changes?: Json;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["change_logs"]["Row"], "id">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
