import { getAgendaSessions, getAgendaFormOptions } from "@/actions/agenda-sessions";
import { getEventInfo } from "@/actions/event-info";
import { archiveColumnReady } from "@/actions/archive";
import { PageHeader } from "@/components/layout/PageHeader";
import { ArchiveColumnsSetup } from "@/components/shared/ArchiveColumnsSetup";
import { AgendaSessionsClient } from "./AgendaSessionsClient";

export default async function AgendaPage() {
  const [sessions, options, archiveReady, eventInfo] = await Promise.all([
    getAgendaSessions(),
    getAgendaFormOptions(),
    archiveColumnReady("agenda_sessions"),
    getEventInfo(),
  ]);
  const archivedCount = sessions.filter((session) => session.archived).length;

  return (
    <div>
      <PageHeader
        title="Agenda"
        description={`${sessions.length} sessions, in run-of-show order${
          archivedCount > 0 ? ` · ${archivedCount} archived` : ""
        }.`}
      />
      {archiveReady ? null : <ArchiveColumnsSetup />}
      <AgendaSessionsClient
        initialData={sessions}
        speakers={options.speakers}
        tags={options.tags}
        eventDate={eventInfo?.event_date ?? ""}
      />
    </div>
  );
}
