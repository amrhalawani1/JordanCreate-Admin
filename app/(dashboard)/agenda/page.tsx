import { getAgendaSessions, getAgendaFormOptions } from "@/actions/agenda-sessions";
import { archiveColumnReady } from "@/actions/archive";
import { PageHeader } from "@/components/layout/PageHeader";
import { ArchiveColumnsSetup } from "@/components/shared/ArchiveColumnsSetup";
import { AgendaSessionsClient } from "./AgendaSessionsClient";

export default async function AgendaPage() {
  const [sessions, options, archiveReady] = await Promise.all([
    getAgendaSessions(),
    getAgendaFormOptions(),
    archiveColumnReady("agenda_sessions"),
  ]);
  const archivedCount = sessions.filter((session) => session.archived).length;

  return (
    <div>
      <PageHeader
        eyebrow="02 / Run of show"
        title="Agenda"
        description={`${sessions.length} sessions, in run-of-show order${
          archivedCount > 0 ? ` · ${archivedCount} archived` : ""
        }.`}
      />
      {archiveReady ? null : <ArchiveColumnsSetup />}
      <AgendaSessionsClient initialData={sessions} speakers={options.speakers} tags={options.tags} />
    </div>
  );
}
