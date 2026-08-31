import { getAgendaSessions, getAgendaFormOptions } from "@/actions/agenda-sessions";
import { PageHeader } from "@/components/layout/PageHeader";
import { AgendaSessionsClient } from "./AgendaSessionsClient";

export default async function AgendaPage() {
  const [sessions, options] = await Promise.all([getAgendaSessions(), getAgendaFormOptions()]);

  return (
    <div>
      <PageHeader
        eyebrow="02 / Run of show"
        title="Agenda"
        description={`${sessions.length} sessions, in run-of-show order.`}
      />
      <AgendaSessionsClient initialData={sessions} speakers={options.speakers} tags={options.tags} />
    </div>
  );
}
