/**
 * Clearly-labelled sample figures, so the team can see the page before Google
 * Analytics is connected. Deterministic (seeded), shaped like an event site a
 * few weeks out: Instagram-led traffic, mostly mobile, mostly Jordan.
 */
import { addDays, type ResolvedRange } from "./ranges";
import type { AnalyticsSnapshot, DailyPoint, RealtimeSnapshot } from "./types";

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function dailySeries(range: ResolvedRange): DailyPoint[] {
  const rand = seeded(range.days * 7919);
  return Array.from({ length: range.days }, (_, i) => {
    const t = range.days === 1 ? 1 : i / (range.days - 1);
    const weekday = new Date(`${addDays(range.start, i)}T00:00:00Z`).getUTCDay();
    const weekend = weekday === 5 || weekday === 6 ? 1.18 : 1;
    const spike = i === Math.floor(range.days * 0.62) ? 2.1 : 1; // a speaker announcement
    const visitors = Math.round((120 + 260 * t) * weekend * spike * (0.85 + rand() * 0.3));
    const previousVisitors = Math.round((80 + 90 * t) * weekend * (0.85 + rand() * 0.3));
    return {
      date: addDays(range.start, i),
      previousDate: addDays(range.previousStart, i),
      visitors,
      views: Math.round(visitors * (2.4 + rand() * 0.6)),
      previousVisitors,
      previousViews: Math.round(previousVisitors * (2.2 + rand() * 0.5)),
    };
  });
}

export function buildSampleSnapshot(range: ResolvedRange): AnalyticsSnapshot {
  const daily = dailySeries(range);
  const sum = (pick: (d: DailyPoint) => number) => daily.reduce((total, d) => total + pick(d), 0);
  // Daily active users double-count returning people; unique visitors are lower.
  const visitors = Math.round(sum((d) => d.visitors) * 0.78);
  const previousVisitors = Math.round(sum((d) => d.previousVisitors) * 0.8);
  const views = sum((d) => d.views);
  const previousViews = sum((d) => d.previousViews);
  const scale = visitors / 1000;
  const n = (base: number) => Math.max(1, Math.round(base * scale));

  return {
    range,
    kpis: {
      visitors: { current: visitors, previous: previousVisitors },
      newVisitors: { current: Math.round(visitors * 0.86), previous: Math.round(previousVisitors * 0.9) },
      sessions: { current: Math.round(visitors * 1.32), previous: Math.round(previousVisitors * 1.25) },
      views: { current: views, previous: previousViews },
      engagementRate: { current: 0.612, previous: 0.574 },
      avgEngagementSeconds: { current: 83, previous: 71 },
      ticketClicks: { current: n(64), previous: Math.round(n(64) * 0.55) },
    },
    daily,
    topPages: [
      { path: "/", title: "Home", views: n(1480), visitors: n(820), avgEngagementSeconds: 52 },
      { path: "/speakers", title: "Speakers", views: n(910), visitors: n(430), avgEngagementSeconds: 96 },
      { path: "/agenda", title: "Agenda", views: n(520), visitors: n(300), avgEngagementSeconds: 74 },
      { path: "/highlighted-speakers-blog/omar-aburob", title: "Omar Aburob", views: n(240), visitors: n(190), avgEngagementSeconds: 118 },
      { path: "/partner-with-us", title: "Partner with us", views: n(170), visitors: n(120), avgEngagementSeconds: 88 },
      { path: "/about-us", title: "About us", views: n(150), visitors: n(110), avgEngagementSeconds: 61 },
      { path: "/community", title: "Community", views: n(120), visitors: n(80), avgEngagementSeconds: 69 },
      { path: "/editions", title: "Editions", views: n(70), visitors: n(55), avgEngagementSeconds: 44 },
    ],
    channels: [
      { key: "Organic Social", label: "Organic Social", value: n(620), previous: n(410), hint: "Unpaid posts on Instagram, TikTok, Facebook and others" },
      { key: "Direct", label: "Direct", value: n(390), previous: n(330), hint: "Typed the address, used a bookmark, or the source was hidden" },
      { key: "Organic Search", label: "Organic Search", value: n(210), previous: n(150), hint: "Google and other search engines" },
      { key: "Referral", label: "Referral", value: n(70), previous: n(80), hint: "Links on other websites" },
      { key: "Unassigned", label: "Unassigned", value: n(25), previous: n(30), hint: "Google Analytics could not tell where these came from" },
    ],
    sources: [
      { key: "l.instagram.com", label: "l.instagram.com", value: n(420), hint: "Instagram link (in-app)" },
      { key: "(direct)", label: "Direct", value: n(390), hint: "No referring site" },
      { key: "google", label: "google", value: n(200), hint: "Google Search" },
      { key: "instagram.com", label: "instagram.com", value: n(160), hint: "Instagram" },
      { key: "tzkrti.com", label: "tzkrti.com", value: n(40) },
      { key: "linkedin.com", label: "linkedin.com", value: n(30), hint: "LinkedIn" },
    ],
    countries: [
      { key: "JO", label: "Jordan", value: n(780), countryCode: "JO" },
      { key: "AE", label: "United Arab Emirates", value: n(70), countryCode: "AE" },
      { key: "SA", label: "Saudi Arabia", value: n(50), countryCode: "SA" },
      { key: "US", label: "United States", value: n(35), countryCode: "US" },
      { key: "PS", label: "Palestine", value: n(25), countryCode: "PS" },
      { key: "GB", label: "United Kingdom", value: n(15), countryCode: "GB" },
    ],
    operatingSystems: [
      { key: "iOS", label: "iOS", value: n(560), hint: "iPhone and iPad" },
      { key: "Android", label: "Android", value: n(250), hint: "Android phones and tablets" },
      { key: "Windows", label: "Windows", value: n(110) },
      { key: "macOS", label: "macOS", value: n(70), hint: "Mac computers" },
      { key: "Linux", label: "Linux", value: n(10) },
    ],
    devices: [
      { key: "mobile", label: "Mobile", value: n(810) },
      { key: "desktop", label: "Desktop", value: n(170) },
      { key: "tablet", label: "Tablet", value: n(20) },
    ],
    outbound: [
      { key: "tickets", label: "Ticket store", hint: "Buy Tickets clicks that went to Tzkrti", clicks: n(64), previous: Math.round(n(64) * 0.55), domains: ["tzkrti.com"] },
      { key: "instagram", label: "Instagram", hint: "Speaker, partner and Jordan Create profiles", clicks: n(48), previous: n(40), domains: ["instagram.com"] },
      { key: "forms", label: "Application forms", hint: "Speaker, partner and volunteer forms on Tally", clicks: n(21), previous: n(26), domains: ["tally.so"] },
      { key: "apps", label: "App downloads", hint: "App Store and Google Play links", clicks: n(9), previous: 0, domains: ["apps.apple.com"] },
    ],
    fetchedAt: new Date().toISOString(),
  };
}

export function buildSampleRealtime(): RealtimeSnapshot {
  return {
    activeUsers: 7,
    pages: [
      { title: "Speakers", users: 3 },
      { title: "Home", users: 2 },
      { title: "Agenda", users: 2 },
    ],
    fetchedAt: new Date().toISOString(),
  };
}
