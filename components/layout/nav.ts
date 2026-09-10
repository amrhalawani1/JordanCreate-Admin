import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarDays,
  ListOrdered,
  Mic2,
  Handshake,
  MapPin,
  Sparkles,
  Tags,
  Megaphone,
  CircleHelp,
  Wand2,
  Layers,
  Users,
  Ticket,
  Lightbulb,
  Shield,
  History,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavGroup = {
  id: string;
  label: string;
  items: readonly NavItem[];
};

export const NAV_GROUPS = [
  {
    id: "overview",
    label: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    id: "program",
    label: "Program",
    items: [
      { href: "/event-info", label: "Event Info", icon: CalendarDays },
      { href: "/agenda", label: "Agenda", icon: ListOrdered },
      { href: "/speakers", label: "Speakers", icon: Mic2 },
      { href: "/entertainment", label: "Entertainment", icon: Sparkles },
    ],
  },
  {
    id: "place",
    label: "Place & Sponsors",
    items: [
      { href: "/venue", label: "Venue", icon: MapPin },
      { href: "/partners", label: "Sponsors", icon: Handshake },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      { href: "/interest-tags", label: "Interest Tags", icon: Tags },
      { href: "/brand-voice", label: "Brand Voice", icon: Megaphone },
      { href: "/faq", label: "FAQ", icon: CircleHelp },
      { href: "/experience", label: "Experience", icon: Wand2 },
      { href: "/other-editions", label: "Other Editions", icon: Layers },
    ],
  },
  {
    id: "guests",
    label: "Guests",
    items: [
      { href: "/guests", label: "Guests", icon: Users },
      { href: "/tickets-management", label: "Tickets", icon: Ticket },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { href: "/request-a-feature", label: "Request a Feature", icon: Lightbulb },
      { href: "/admin-settings", label: "Admin Management", icon: Shield },
      { href: "/change-log", label: "Change Log", icon: History },
    ],
  },
] as const satisfies readonly NavGroup[];

/** Flat list kept for any callers that need every route. */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => [...group.items]);
