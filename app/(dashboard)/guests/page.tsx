import { ComingSoon } from "@/components/shared/ComingSoon";
import { PageHeader } from "@/components/layout/PageHeader";

export default function GuestsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="10 / People"
        title="Guests"
        description="The guest list the app, concierge bot, and door team will use."
      />
      <ComingSoon message="This page is not ready yet." />
    </div>
  );
}
