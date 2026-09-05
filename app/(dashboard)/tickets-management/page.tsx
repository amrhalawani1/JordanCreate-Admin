import { ComingSoon } from "@/components/shared/ComingSoon";
import { PageHeader } from "@/components/layout/PageHeader";

export default function TicketsManagementPage() {
  return (
    <div>
      <PageHeader
        eyebrow="13 / Access"
        title="Tickets Management"
        description="Issue, track, and resolve tickets for the event."
      />
      <ComingSoon message="This page is not ready yet." />
    </div>
  );
}
