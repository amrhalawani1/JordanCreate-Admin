"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertStaff } from "@/lib/auth/guard";
import type { EventInfo, JordanCreateOne, JordanCreateThree } from "@/types/entities";

export interface TableSummary {
  key: string;
  label: string;
  href: string;
  count: number;
  updatedAt: string | null;
}

export interface DashboardSummary {
  tables: TableSummary[];
  flags: string[];
}

function isTbdOrEmpty(value: string | null): boolean {
  return !value || value.trim() === "" || value.trim().toUpperCase() === "TBD";
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await assertStaff();
  const supabase = createAdminClient();

  const [
    eventInfoRes,
    agendaRes,
    speakersRes,
    venueRes,
    tagsRes,
    brandVoiceRes,
    faqRes,
    experienceRes,
    jc1Res,
    jc3Res,
    missingBiosRes,
    ticketsAwaitingRes,
    ticketsCountRes,
  ] = await Promise.all([
    supabase.from("event_info").select("*").maybeSingle(),
    supabase.from("agenda_sessions").select("*", { count: "exact", head: true }),
    supabase.from("speakers").select("*", { count: "exact", head: true }),
    supabase.from("venue_zones").select("*", { count: "exact", head: true }),
    supabase.from("interest_tags").select("*", { count: "exact", head: true }),
    supabase.from("brand_voice").select("*").maybeSingle(),
    supabase.from("faq_entries").select("*", { count: "exact", head: true }),
    supabase.from("experience").select("*", { count: "exact", head: true }),
    supabase.from("jordan_create_one").select("*").maybeSingle(),
    supabase.from("jordan_create_three").select("*").maybeSingle(),
    supabase.from("speakers").select("*", { count: "exact", head: true }).eq("bio_status", "missing"),
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .is("approved_at", null)
      .is("rejected_at", null),
    supabase.from("tickets").select("id", { count: "exact", head: true }),
  ]);

  const flags: string[] = [];

  const eventInfo = eventInfoRes.data as EventInfo | null;
  if (eventInfo) {
    if (isTbdOrEmpty(eventInfo.wifi_password)) flags.push("Event Info: wifi_password is TBD");
    if (isTbdOrEmpty(eventInfo.google_maps_link)) flags.push("Event Info: google_maps_link is missing");
  }

  const missingBios = missingBiosRes.count ?? 0;
  if (missingBios > 0) flags.push(`Speakers: ${missingBios} missing bio${missingBios === 1 ? "" : "s"}`);

  const awaitingTickets = ticketsAwaitingRes.error ? 0 : (ticketsAwaitingRes.count ?? 0);
  const ticketCount = ticketsCountRes.error ? 0 : (ticketsCountRes.count ?? 0);
  if (awaitingTickets > 0) {
    flags.push(`Tickets: ${awaitingTickets} awaiting approval`);
  }

  const jc1 = jc1Res.data as JordanCreateOne | null;
  if (jc1 && isTbdOrEmpty(jc1.status)) flags.push("Other Editions: Jordan Create 1 status is TBD");
  const jc3 = jc3Res.data as JordanCreateThree | null;
  if (jc3 && isTbdOrEmpty(jc3.status)) flags.push("Other Editions: Jordan Create 3 status is TBD");

  const tables: TableSummary[] = [
    {
      key: "event_info",
      label: "Event Info",
      href: "/event-info",
      count: eventInfo ? 1 : 0,
      updatedAt: eventInfo?.updated_at ?? null,
    },
    { key: "agenda", label: "Agenda", href: "/agenda", count: agendaRes.count ?? 0, updatedAt: null },
    { key: "speakers", label: "Speakers", href: "/speakers", count: speakersRes.count ?? 0, updatedAt: null },
    { key: "venue", label: "Venue Zones", href: "/venue", count: venueRes.count ?? 0, updatedAt: null },
    {
      key: "interest_tags",
      label: "Interest Tags",
      href: "/interest-tags",
      count: tagsRes.count ?? 0,
      updatedAt: null,
    },
    {
      key: "brand_voice",
      label: "Brand Voice",
      href: "/brand-voice",
      count: brandVoiceRes.data ? 1 : 0,
      updatedAt: null,
    },
    { key: "faq", label: "FAQ", href: "/faq", count: faqRes.count ?? 0, updatedAt: null },
    {
      key: "experience",
      label: "Experience",
      href: "/experience",
      count: experienceRes.count ?? 0,
      updatedAt: null,
    },
    {
      key: "other_editions",
      label: "Other Editions",
      href: "/other-editions",
      count: (jc1 ? 1 : 0) + (jc3 ? 1 : 0),
      updatedAt: null,
    },
    {
      key: "tickets",
      label: "Tickets",
      href: "/tickets-management",
      count: ticketCount,
      updatedAt: null,
    },
  ];

  return { tables, flags };
}
