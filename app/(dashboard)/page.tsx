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
        eyebrow="00 / Overview"
        title="Dashboard"
        description="One place to edit the data that feeds the Jordan Create app and concierge bot."
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
        <Alert className="mb-8 rounded-[4px] border-orange/40 bg-orange/5">
          <AlertTriangle className="text-orange" />
          <AlertTitle className="text-orange">Needs attention</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-foreground/90">
              {flags.map((flag) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[4px] border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => (
          <SummaryCard key={table.key} table={table} />
        ))}
      </div>
    </div>
  );
}
