import { getAgendaSessions, getAgendaFormOptions } from "@/actions/agenda-sessions";
import { AgendaSessionsClient } from "./AgendaSessionsClient";

export default async function AgendaPage() {
  const [sessions, options] = await Promise.all([getAgendaSessions(), getAgendaFormOptions()]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Agenda</h1>
        <p className="text-sm text-muted-foreground">{sessions.length} sessions, in run-of-show order.</p>
      </div>
      <AgendaSessionsClient initialData={sessions} speakers={options.speakers} tags={options.tags} />
    </div>
  );
}
