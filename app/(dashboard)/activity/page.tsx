import { getActivityLogs } from "@/actions/activity-logs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ActivityClient } from "./ActivityClient";
import { ActivitySetup } from "./ActivitySetup";

export default async function ActivityPage() {
  const { rows, error, needsSetup } = await getActivityLogs();

  return (
    <div>
      <PageHeader
        title="Activity Log"
        description="Everything that happened on this admin and its integrations: every save, sign-in, page opened, webhook call and error, whether it worked or not. The Change Log shows what changed; this shows every attempt."
      />
      {needsSetup ? (
        <ActivitySetup />
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <ActivityClient initialData={rows} />
      )}
    </div>
  );
}
