import { getTickets } from "@/actions/tickets";
import { getTzkrtiStatus } from "@/actions/tzkrti";
import { TzkrtiConnectionCard } from "@/components/tickets/TzkrtiConnectionCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TicketsSetup } from "@/components/tickets/TicketsSetup";
import { TicketsClient } from "./TicketsClient";

export default async function TicketsManagementPage() {
  const [{ rows, error, needsSetup, needsFunctions }, tzkrti] = await Promise.all([getTickets(), getTzkrtiStatus()]);
  const awaiting = rows.filter(
    (row) => row.status === "active" && !row.approved && row.rejected_at == null,
  ).length;

  return (
    <div>
      <PageHeader
        title="Tickets Management"
        description={
          awaiting === 1
            ? "1 ticket waiting for a gate credential. Until you approve, the guest sees a ticket-being-prepared screen."
            : `${awaiting} tickets waiting for a gate credential. Until you approve, guests see a ticket-being-prepared screen.`
        }
      />
      <TzkrtiConnectionCard status={tzkrti} />
      {needsSetup ? (
        <TicketsSetup />
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          {needsFunctions ? (
            <div className="mb-6">
              <TicketsSetup compact />
            </div>
          ) : null}
          <TicketsClient initialData={rows} />
        </>
      )}
    </div>
  );
}
