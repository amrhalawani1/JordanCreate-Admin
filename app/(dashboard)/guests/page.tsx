import { getGuestProfiles } from "@/actions/guest-profiles";
import { getGuestSocialLinks } from "@/actions/guest-social-links";
import { PageHeader } from "@/components/layout/PageHeader";
import { GuestsClient } from "./GuestsClient";

export default async function GuestsPage() {
  const [guests, socialLinks] = await Promise.all([getGuestProfiles(), getGuestSocialLinks()]);

  return (
    <div>
      <PageHeader
        eyebrow="10 / People"
        title="Guests"
        description={`${guests.length} guest${guests.length === 1 ? "" : "s"} on the list the app, concierge bot, and door team will use.`}
      />
      <GuestsClient initialData={guests} socialLinks={socialLinks} />
    </div>
  );
}
