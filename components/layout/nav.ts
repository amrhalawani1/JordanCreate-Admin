import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ChartLine,
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
  Activity,
  BellRing,
  Smartphone,
  Flag,
  Globe,
  Newspaper,
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
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/analytics", label: "Website Analytics", icon: ChartLine },
    ],
  },
  {
    // Everything that describes the event itself: when, what, who, where.
    id: "event",
    label: "Event",
    items: [
      { href: "/event-info", label: "Event Info", icon: CalendarDays },
      { href: "/agenda", label: "Agenda", icon: ListOrdered },
      { href: "/speakers", label: "Speakers", icon: Mic2 },
      { href: "/entertainment", label: "Entertainment", icon: Sparkles },
      { href: "/venue", label: "Venue", icon: MapPin },
      { href: "/partners", label: "Sponsors", icon: Handshake },
    ],
  },
  {
    id: "guests",
    label: "Guests",
    items: [
      { href: "/guests", label: "Guests", icon: Users },
      { href: "/tickets-management", label: "Tickets", icon: Ticket },
      { href: "/broadcasts", label: "Notifications", icon: BellRing },
      { href: "/reported-incidents", label: "Reported Incidents", icon: Flag },
    ],
  },
  {
    // What guests see on each channel, beyond the event data above.
    id: "content",
    label: "Content",
    items: [
      { href: "/mobile-app-management", label: "Mobile App", icon: Smartphone },
      { href: "/website-management", label: "Website", icon: Globe },
      { href: "/community-articles", label: "Community Articles", icon: Newspaper },
    ],
  },
  {
    // Reference content the app and the WhatsApp bot answer from.
    id: "knowledge",
    label: "App & Bot Knowledge",
    items: [
      { href: "/faq", label: "FAQ", icon: CircleHelp },
      { href: "/experience", label: "Experience", icon: Wand2 },
      { href: "/interest-tags", label: "Interest Tags", icon: Tags },
      { href: "/brand-voice", label: "Brand Voice", icon: Megaphone },
      { href: "/other-editions", label: "Other Editions", icon: Layers },
    ],
  },
  {
    id: "team",
    label: "Team",
    items: [
      { href: "/admin-settings", label: "Admin Management", icon: Shield },
      { href: "/change-log", label: "Change Log", icon: History },
      { href: "/activity", label: "Activity Log", icon: Activity },
      { href: "/request-a-feature", label: "Request a Feature", icon: Lightbulb },
    ],
  },
] as const satisfies readonly NavGroup[];

/** Flat list kept for any callers that need every route. */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => [...group.items]);
