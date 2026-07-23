import { AlertTriangle } from "lucide-react";
import { getDashboardSummary } from "@/actions/dashboard";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function DashboardPage() {
  const { tables, flags } = await getDashboardSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of every table backing the Jordan Create bot.
        </p>
      </div>

      {flags.length > 0 && (
        <Alert className="border-warning/40 bg-warning/5">
          <AlertTriangle className="text-warning" />
          <AlertTitle className="text-warning">Needs attention</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-foreground/90">
              {flags.map((flag) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => (
          <SummaryCard key={table.key} table={table} />
        ))}
      </div>
    </div>
  );
}
