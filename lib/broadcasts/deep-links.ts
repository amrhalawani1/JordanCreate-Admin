/** Screens a broadcast can open in the guest app. Values are app routes. */
export const BROADCAST_DESTINATIONS = [
  { value: "", label: "No link (opens the app)" },
  { value: "/", label: "Home" },
  { value: "/agenda", label: "Agenda" },
  { value: "/speakers", label: "Speakers" },
  { value: "/ticket", label: "Ticket" },
  { value: "/destination/map", label: "Venue map" },
  { value: "/destination/entertainment", label: "Entertainment" },
  { value: "/destination/workshops", label: "Workshops" },
  { value: "/destination/partners", label: "Sponsors" },
  { value: "/destination/faq", label: "FAQ" },
] as const;

export type BroadcastDestination = (typeof BROADCAST_DESTINATIONS)[number]["value"];

export function isBroadcastDestination(value: string): value is BroadcastDestination {
  return BROADCAST_DESTINATIONS.some((option) => option.value === value);
}

export function destinationLabel(value: string | null | undefined): string {
  return BROADCAST_DESTINATIONS.find((option) => option.value === (value ?? ""))?.label ?? value ?? "";
}
