import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getDashboardSummary } from "@/actions/dashboard";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExportButton } from "@/components/shared/ExportButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function DashboardPage() {
  const { tables, flags } = await getDashboardSummary();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Edit the shared data that powers the Jordan Create app and concierge bot."
        action={
          <ExportButton
            title="Dashboard"
            fileStem="dashboard"
            tables={[
              {
                caption: "Registry tables",
                columns: [
                  { key: "label", header: "Table" },
                  { key: "count", header: "Rows" },
                  { key: "updatedAt", header: "Last updated" },
                ],
                rows: tables.map((table) => ({
                  label: table.label,
                  count: table.count,
                  updatedAt: table.updatedAt,
                })),
              },
              ...(flags.length > 0
                ? [
                    {
                      caption: "Needs attention",
                      columns: [{ key: "flag", header: "Flag" }],
                      rows: flags.map((flag) => ({ flag })),
                    },
                  ]
                : []),
            ]}
          />
        }
      />

      {flags.length > 0 && (
        <Alert className="mb-6 rounded-xl border-orange/30 bg-orange/5">
          <AlertTriangle className="text-orange" />
          <AlertTitle className="text-orange">Needs attention</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-foreground/90">
              {flags.map((flag) => (
                <li key={flag}>
                  {flag.startsWith("Tickets:") ? (
                    <Link href="/tickets-management" className="underline decoration-orange/60 underline-offset-2 hover:text-orange">
                      {flag}
                    </Link>
                  ) : (
                    flag
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tables.map((table) => (
          <SummaryCard key={table.key} table={table} />
        ))}
      </div>
    </div>
  );
}
