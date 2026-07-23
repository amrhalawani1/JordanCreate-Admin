import {
  getJordanCreateOne,
  getJordanCreateThree,
  updateJordanCreateOne,
  updateJordanCreateThree,
} from "@/actions/other-editions";
import { jordanEditionFields } from "@/lib/entity-configs/other-editions";
import { JordanEditionSchema, type JordanEditionFormValues } from "@/lib/validation/other-editions";
import { SingletonForm } from "@/components/shared/SingletonForm";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function OtherEditionsPage() {
  const [one, three] = await Promise.all([getJordanCreateOne(), getJordanCreateThree()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Other Editions</h1>
        <p className="text-sm text-muted-foreground">
          Placeholder records for the other Jordan Create events in the series.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Jordan Create 1</h2>
        {one ? (
          <SingletonForm
            fields={jordanEditionFields}
            schema={JordanEditionSchema}
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
        <h2 className="text-sm font-medium text-muted-foreground">Jordan Create 3</h2>
        {three ? (
          <SingletonForm
            fields={jordanEditionFields}
            schema={JordanEditionSchema}
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
