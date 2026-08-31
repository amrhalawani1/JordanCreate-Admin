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
import { MultiSelectField } from "@/components/shared/fields/MultiSelectField";
import { SingleSelectField } from "@/components/shared/fields/SingleSelectField";

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
  /** Existing records open read-only until the user presses Edit. */
  startInShowMode?: boolean;
}

export function EntityForm<Row, Values extends FieldValues>({
  fields,
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  submitLabel = "Save",
  disabledFields = [],
  startInShowMode = false,
}: EntityFormProps<Row, Values>) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!startInShowMode);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema) as Resolver<Values>,
    defaultValues: defaultValues as never,
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await onSubmit(values);
    if (result.success) {
      if (startInShowMode) setIsEditing(false);
      onSuccess();
    } else {
      setFormError(result.error ?? "Something went wrong while saving.");
    }
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {fields.map((field) => {
        const name = field.name as string;
        const isDisabled = !isEditing || disabledFields.includes(field.name);
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
                      {field.enumLabels?.[value] ?? value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.type === "password" && (
              <Input
                id={name}
                type="password"
                autoComplete="new-password"
                disabled={isDisabled}
                placeholder={field.placeholder}
                {...register(name as never)}
              />
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
                disabled={isDisabled}
                value={String(watch(name as never) ?? "")}
                onChange={(value) => setValue(name as never, value as never, { shouldValidate: true })}
              />
            )}

            {field.type === "multiselect-ref" && (
              <MultiSelectField
                id={name}
                disabled={isDisabled}
                value={(watch(name as never) as unknown as string[]) ?? []}
                options={field.referenceOptions ?? []}
                onChange={(value) => setValue(name as never, value as never, { shouldValidate: true })}
              />
            )}

            {field.type === "select-ref" && (
              <SingleSelectField
                id={name}
                disabled={isDisabled}
                value={(watch(name as never) as unknown as string | null) ?? null}
                options={field.referenceOptions ?? []}
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
        <p className="rounded-[4px] bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {formError}
        </p>
      )}

      {startInShowMode && !isEditing ? (
        <Button type="button" className="mt-2" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          {startInShowMode && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setFormError(null);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
