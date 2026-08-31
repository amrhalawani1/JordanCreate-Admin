import { getChangeLogs } from "@/actions/change-logs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChangeLogClient } from "./ChangeLogClient";
import { ChangeLogSetup } from "./ChangeLogSetup";

export default async function ChangeLogPage() {
  const { rows, error, needsSetup } = await getChangeLogs();

  return (
    <div>
      <PageHeader
        eyebrow="14 / Audit"
        title="Change Log"
        description="Every save on this admin: what changed, and who did it."
      />
      {needsSetup ? (
        <ChangeLogSetup />
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <ChangeLogClient initialData={rows} />
      )}
    </div>
  );
}
