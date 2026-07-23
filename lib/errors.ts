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
        return "That value isn't allowed for this field. Please pick one of the listed options.";
      case "23502":
        return "A required field is missing.";
      case "23505":
        return "That ID is already in use. Choose a different one.";
      case "23503":
        return "This references something that no longer exists.";
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
