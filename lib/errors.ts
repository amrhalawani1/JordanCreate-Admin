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
      case "22P02": {
        const text = `${error.message} ${error.details ?? ""}`;
        if (text.includes("admin_level")) {
          return "The database does not allow this access level yet. Run the Admin - View Only SQL on Admin Management, then try again.";
        }
        if (text.includes("partners_tier_check")) {
          return "Tier must be Headline, Supporting, or Community.";
        }
        if (text.includes("entertainment_act_type_check")) {
          return "Type must be DJ, Magic Show, Live Performance, Band, or Other.";
        }
        return "That value isn't allowed for this field. Please pick one of the listed options.";
      }
      case "23502":
        return "A required field is missing.";
      case "23505": {
        const text = `${error.message} ${error.details ?? ""}`;
        if (text.includes("ticket_ref")) {
          return "That ticket reference is already in use. If a webhook later hits the same reference as a manual ticket, that is a collision. Do not overwrite the manual row.";
        }
        return "That ID is already in use. Choose a different one.";
      }
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
      default: {
        const text = `${error.message} ${error.details ?? ""}`;
        if (text.includes("TICKET_SOURCE_COLLISION")) {
          return "This manual ticket collides with an inbound update. The original row was left unchanged.";
        }
        if (text.includes("already void")) {
          return "Access is already revoked.";
        }
        if (text.includes("Void them instead") || text.includes("cannot be rejected")) {
          return "Approved tickets cannot be rejected. Revoke access instead.";
        }
        if (text.includes("NO_PERMISSION") || error.code === "42501") {
          return "You don't have permission to do that.";
        }
        return error.message || "The database rejected this change.";
      }
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
