export type DestinationOption = { value: string; label: string };

/** Fixed app screens a Hot Topic card may open, besides a specific act or session. */
export const STATIC_DESTINATIONS: DestinationOption[] = [
  { value: "agenda", label: "Agenda" },
  { value: "entertainment", label: "Entertainment" },
  { value: "speakers", label: "Speakers" },
  { value: "workshops", label: "Workshops" },
  { value: "ticket", label: "Ticket" },
  { value: "network", label: "Network" },
  { value: "map", label: "Map" },
  { value: "partners", label: "Sponsors" },
  { value: "faq", label: "FAQ" },
  { value: "interests", label: "Interests" },
];
