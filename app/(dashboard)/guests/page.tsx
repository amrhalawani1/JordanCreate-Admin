import { getGuestProfiles } from "@/actions/guest-profiles";
import { getGuestSocialLinks } from "@/actions/guest-social-links";
import { getGuestReports } from "@/actions/guest-reports";
import { PageHeader } from "@/components/layout/PageHeader";
import { GuestsClient } from "./GuestsClient";
import { ReportedIncidents } from "./ReportedIncidents";

export default async function GuestsPage() {
  const [guests, socialLinks, reports] = await Promise.all([getGuestProfiles(), getGuestSocialLinks(), getGuestReports()]);

  return (
    <div>
      <PageHeader
        title="Guests"
        description={`${guests.length} guest${guests.length === 1 ? "" : "s"} on the list the app, concierge bot, and door team will use.`}
      />
      <ReportedIncidents result={reports} />
      <GuestsClient initialData={guests} socialLinks={socialLinks} />
    </div>
  );
}
