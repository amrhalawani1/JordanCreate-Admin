import {
  getJordanCreateOne,
  getJordanCreateThree,
  updateJordanCreateOne,
  updateJordanCreateThree,
} from "@/actions/other-editions";
import type { JordanEditionFormValues } from "@/lib/validation/other-editions";
import { jordanEditionFields } from "@/lib/entity-configs/other-editions";
import { fieldValueTable } from "@/lib/export-html";
import { JordanEditionForm } from "./JordanEditionForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExportButton } from "@/components/shared/ExportButton";

export default async function OtherEditionsPage() {
  const [one, three] = await Promise.all([getJordanCreateOne(), getJordanCreateThree()]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Other Editions"
        description="Placeholder records for the other Jordan Create events in the series."
        action={
          <ExportButton
            title="Other Editions"
            fileStem="other-editions"
            tables={[
              ...(one
                ? [
                    {
                      ...fieldValueTable(jordanEditionFields, one, [
                        { label: "Last updated", value: one.updated_at },
                      ]),
                      caption: "Jordan Create 1",
                    },
                  ]
                : []),
              ...(three
                ? [
                    {
                      ...fieldValueTable(jordanEditionFields, three, [
                        { label: "Last updated", value: three.updated_at },
                      ]),
                      caption: "Jordan Create 3",
                    },
                  ]
                : []),
            ]}
          />
        }
      />

      <div className="space-y-3">
        <h2 className="jc-label">Jordan Create 1</h2>
        {one ? (
          <JordanEditionForm
            defaultValues={
              {
                name: one.name,
                status: one.status,
                notes: one.notes ?? "",
              } satisfies JordanEditionFormValues
            }
            onSubmit={updateJordanCreateOne}
            successMessage="Jordan Create 1 updated."
          />
        ) : (
          <EmptyState message="jordan_create_one row is missing from the database." />
        )}
      </div>

      <div className="space-y-3">
        <h2 className="jc-label">Jordan Create 3</h2>
        {three ? (
          <JordanEditionForm
            defaultValues={
              {
                name: three.name,
                status: three.status,
                notes: three.notes ?? "",
              } satisfies JordanEditionFormValues
            }
            onSubmit={updateJordanCreateThree}
            successMessage="Jordan Create 3 updated."
          />
        ) : (
          <EmptyState message="jordan_create_three row is missing from the database." />
        )}
      </div>
    </div>
  );
}
