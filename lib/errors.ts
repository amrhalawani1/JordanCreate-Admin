import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Turns a Postgres/Supabase error into a message safe to show a
 * non-technical user, special-casing the constraint violations this app
 * cares about instead of a generic "something went wrong."
 */
export function getReadableError(error: unknown): string {
  if (isPostgrestError(error)) {
    switch (error.code) {
      case "23514":
        if (typeof error.message === "string" && error.message.includes("partners_tier_check")) {
          return "Tier must be Headline, Supporting, or Community.";
        }
        if (typeof error.message === "string" && error.message.includes("entertainment_act_type_check")) {
          return "Type must be DJ, Magic Show, Live Performance, Band, or Other.";
        }
        return "That value isn't allowed for this field. Please pick one of the listed options.";
      case "23502":
        return "A required field is missing.";
      case "23505":
        return "That ID is already in use. Choose a different one.";
      case "23503":
        return "This references something that no longer exists.";
      case "PGRST204":
      case "42703":
        if (typeof error.message === "string" && error.message.includes("archived")) {
          return "Archive is not set up yet. Run the archive SQL in Supabase, then refresh this page.";
        }
        return error.message || "The database rejected this change.";
      case "PGRST205":
        return "This table is not set up yet. Finish the database setup, then try again.";
      default:
        return error.message || "The database rejected this change.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong while saving. Please try again.";
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "details" in error
  );
}
