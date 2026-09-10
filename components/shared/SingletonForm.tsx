"use client";

import type { FieldValues } from "react-hook-form";
import type { ZodType } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { EntityForm, type EntityFormResult } from "@/components/shared/EntityForm";
import type { FieldConfig } from "@/lib/entity-configs/types";

interface SingletonFormProps<Row, Values extends FieldValues> {
  fields: FieldConfig<Row>[];
  schema: ZodType<Values, Values>;
  defaultValues: Values;
  onSubmit: (values: Values) => Promise<EntityFormResult>;
  successMessage?: string;
}

export function SingletonForm<Row, Values extends FieldValues>({
  fields,
  schema,
  defaultValues,
  onSubmit,
  successMessage = "Saved.",
}: SingletonFormProps<Row, Values>) {
  const router = useRouter();

  return (
    <Card className="jc-content-narrow w-full">
      <CardContent className="pt-1">
        <EntityForm
          fields={fields}
          schema={schema}
          defaultValues={defaultValues}
          startInShowMode
          submitLabel="Save changes"
          onSubmit={onSubmit}
          onSuccess={() => {
            toast.success(successMessage);
            router.refresh();
          }}
        />
      </CardContent>
    </Card>
  );
}
