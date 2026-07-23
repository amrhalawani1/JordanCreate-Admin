"use client";

import { jordanEditionFields } from "@/lib/entity-configs/other-editions";
import { JordanEditionSchema, type JordanEditionFormValues } from "@/lib/validation/other-editions";
import { SingletonForm } from "@/components/shared/SingletonForm";
import type { EntityFormResult } from "@/components/shared/EntityForm";

interface JordanEditionFormProps {
  defaultValues: JordanEditionFormValues;
  onSubmit: (values: unknown) => Promise<EntityFormResult>;
  successMessage: string;
}

export function JordanEditionForm({ defaultValues, onSubmit, successMessage }: JordanEditionFormProps) {
  return (
    <SingletonForm
      fields={jordanEditionFields}
      schema={JordanEditionSchema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      successMessage={successMessage}
    />
  );
}
