import { getGuestProfiles } from "@/actions/guest-profiles";
import { getGuestSocialLinks } from "@/actions/guest-social-links";
import { getGuestReports } from "@/actions/guest-reports";
import { PageHeader } from "@/components/layout/PageHeader";
import { GuestsClient } from "./GuestsClient";
import Link from "next/link";
import { Flag } from "lucide-react";
import { isClosed } from "@/lib/guest-reports/reports";

export default async function GuestsPage() {
  const [guests, socialLinks, reports] = await Promise.all([getGuestProfiles(), getGuestSocialLinks(), getGuestReports()]);

  const openReports = reports.status === "ready" ? reports.reports.filter((report) => !isClosed(report.status)).length : 0;

  return (
    <div>
      <PageHeader
        title="Guests"
        description={`${guests.length} guest${guests.length === 1 ? "" : "s"} on the list the app, concierge bot, and door team will use.`}
      />
      {openReports > 0 ? (
        <Link
          href="/reported-incidents"
          className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm transition-colors hover:bg-destructive/15"
        >
          <Flag className="size-4 shrink-0 text-destructive" aria-hidden />
          <span className="flex-1">
            {openReports === 1 ? "1 reported profile is" : `${openReports} reported profiles are`} waiting for review.
          </span>
          <span className="font-medium text-destructive">Review</span>
        </Link>
      ) : null}
      <GuestsClient initialData={guests} socialLinks={socialLinks} />
    </div>
  );
}
