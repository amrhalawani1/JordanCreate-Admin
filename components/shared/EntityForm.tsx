"use client";

import { useForm, type FieldValues, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { useState } from "react";
import type { FieldConfig } from "@/lib/entity-configs/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChipListField } from "@/components/shared/fields/ChipListField";

export interface EntityFormResult {
  success: boolean;
  error?: string;
}

interface EntityFormProps<Row, Values extends FieldValues> {
  fields: FieldConfig<Row>[];
  schema: ZodType<Values, Values>;
  defaultValues: Values;
  onSubmit: (values: Values) => Promise<EntityFormResult>;
  onSuccess: () => void;
  submitLabel?: string;
  disabledFields?: (keyof Row & string)[];
}

export function EntityForm<Row, Values extends FieldValues>({
  fields,
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  submitLabel = "Save",
  disabledFields = [],
}: EntityFormProps<Row, Values>) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema) as Resolver<Values>,
    defaultValues: defaultValues as never,
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await onSubmit(values);
    if (result.success) {
      onSuccess();
    } else {
      setFormError(result.error ?? "Something went wrong while saving.");
    }
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {fields.map((field) => {
        const name = field.name as string;
        const isDisabled = disabledFields.includes(field.name);
        const fieldError = errors[name as keyof Values];

        return (
          <div key={name} className="space-y-1.5">
            {field.type !== "boolean" && (
              <Label htmlFor={name}>
                {field.label}
                {field.required && <span className="text-destructive"> *</span>}
              </Label>
            )}

            {field.type === "textarea" && (
              <Textarea
                id={name}
                disabled={isDisabled}
                placeholder={field.placeholder}
                {...register(name as never)}
              />
            )}

            {field.type === "number" && (
              <Input
                id={name}
                type="number"
                disabled={isDisabled}
                placeholder={field.placeholder}
                {...register(name as never, { valueAsNumber: true })}
              />
            )}

            {field.type === "url" && (
              <Input
                id={name}
                type="url"
                disabled={isDisabled}
                placeholder={field.placeholder}
                {...register(name as never)}
              />
            )}

            {field.type === "date" && (
              <Input id={name} type="date" disabled={isDisabled} {...register(name as never)} />
            )}

            {field.type === "time" && (
              <Input id={name} type="time" disabled={isDisabled} {...register(name as never)} />
            )}

            {field.type === "boolean" && (
              <div className="flex items-center gap-2 pt-1">
                <Switch
                  id={name}
                  checked={Boolean(watch(name as never))}
                  disabled={isDisabled}
                  onCheckedChange={(checked) => setValue(name as never, checked as never, { shouldValidate: true })}
                />
                <Label htmlFor={name} className="font-normal">
                  {field.label}
                </Label>
              </div>
            )}

            {field.type === "enum" && (
              <Select
                value={String(watch(name as never) ?? "")}
                disabled={isDisabled}
                onValueChange={(value) => setValue(name as never, value as never, { shouldValidate: true })}
              >
                <SelectTrigger id={name} className="w-full">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {field.enumValues?.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(field.type === "text" || field.type === "suggest-text") && (
              <Input
                id={name}
                disabled={isDisabled}
                placeholder={field.placeholder}
                list={field.type === "suggest-text" ? `${name}-suggestions` : undefined}
                {...register(name as never)}
              />
            )}
            {field.type === "chip-list" && (
              <ChipListField
                id={name}
                value={String(watch(name as never) ?? "")}
                onChange={(value) => setValue(name as never, value as never, { shouldValidate: true })}
              />
            )}

            {field.type === "suggest-text" && field.referenceOptions && (
              <datalist id={`${name}-suggestions`}>
                {field.referenceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} />
                ))}
              </datalist>
            )}

            {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
            {fieldError && (
              <p className="text-xs text-destructive">{String(fieldError.message ?? "Invalid value.")}</p>
            )}
          </div>
        );
      })}

      {formError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
