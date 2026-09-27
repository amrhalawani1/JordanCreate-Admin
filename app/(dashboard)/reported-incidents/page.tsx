import { getGuestReports } from "@/actions/guest-reports";
import { PageHeader } from "@/components/layout/PageHeader";
import { isClosed } from "@/lib/guest-reports/reports";
import { ReportedIncidents } from "./ReportedIncidents";

export default async function ReportedIncidentsPage() {
  const reports = await getGuestReports();
  const open = reports.status === "ready" ? reports.reports.filter((report) => !isClosed(report.status)).length : 0;

  return (
    <div>
      <PageHeader
        title="Reported incidents"
        description={
          open === 0
            ? "Profiles guests reported from the app. Nothing is waiting for review."
            : `${open} open report${open === 1 ? "" : "s"} from the app waiting for review. Each one also emailed the team.`
        }
      />
      <ReportedIncidents result={reports} />
    </div>
  );
}
