import type { AdminLevel } from "@/types/entities";
import { isStaffEditorLevel, isStaffLevel, isViewOnlyLevel } from "@/lib/auth/levels";

export const TICKET_ACTIONS = ["approve", "reject", "restore", "create", "update", "void", "delete"] as const;
export type TicketAction = (typeof TICKET_ACTIONS)[number];

export function canTicketAction(level: AdminLevel, action: TicketAction): boolean {
  if (isViewOnlyLevel(level)) return false;
  if (action === "void" || action === "delete") {
    return isStaffEditorLevel(level);
  }
  return isStaffEditorLevel(level) || level === "guest_manager";
}

export function canReadTickets(level: AdminLevel): boolean {
  return isStaffLevel(level) || level === "guest_manager";
}

export const VIEW_ONLY_TICKET_ERROR =
  "You have view-only access. You can look, but you cannot save changes.";
export const NO_ADMIN_PROFILE_ERROR = "You don't have an admin profile.";
export const NO_TICKET_PERMISSION_ERROR = "You don't have permission to do that.";

/** Server actions and RPCs must use this — hiding buttons is not access control. */
export function ticketActionDenied(
  level: AdminLevel | null | undefined,
  action: TicketAction,
): string | null {
  if (!level) return NO_ADMIN_PROFILE_ERROR;
  if (isViewOnlyLevel(level)) return VIEW_ONLY_TICKET_ERROR;
  if (!canTicketAction(level, action)) return NO_TICKET_PERMISSION_ERROR;
  return null;
}

export function isQrTokenIssued(token: string | null | undefined): boolean {
  return Boolean(token?.trim());
}
