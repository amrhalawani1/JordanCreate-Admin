"use client";

import { useForm, type FieldValues, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { useState, type ReactNode } from "react";
import type { FieldConfig, FieldType } from "@/lib/entity-configs/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChipListField } from "@/components/shared/fields/ChipListField";
import { MultiSelectField } from "@/components/shared/fields/MultiSelectField";
import { SingleSelectField } from "@/components/shared/fields/SingleSelectField";
import { ImageUploadField } from "@/components/shared/fields/ImageUploadField";
import { sanitizeMediaSlug, cn } from "@/lib/utils";
import { useAdminAccess } from "@/components/layout/AdminAccessProvider";
import { useInEntityDrawer } from "@/components/shared/EntityDrawer";

export interface EntityFormResult {
  success: boolean;
  error?: string;
}

const FULL_WIDTH_TYPES = new Set<FieldType>([
  "textarea",
  "image",
  "chip-list",
  "multiselect-ref",
  "boolean",
]);

function isFullWidthField(field: FieldConfig<unknown>) {
  return FULL_WIDTH_TYPES.has(field.type);
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
  children?: ReactNode | ((ctx: { isEditing: boolean }) => ReactNode);
  onCancel?: () => void;
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
  children,
  onCancel,
}: EntityFormProps<Row, Values>) {
  const { canEdit } = useAdminAccess();
  const stickyActions = useInEntityDrawer();
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(canEdit && !startInShowMode);
  const editing = canEdit && isEditing;
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
    if (!canEdit) return;
    setFormError(null);
    const result = await onSubmit(values);
    if (result.success) {
      if (startInShowMode) setIsEditing(false);
      onSuccess();
    } else {
      setFormError(result.error ?? "Something went wrong while saving.");
    }
  });

  const actions =
    canEdit ? (
      startInShowMode && !isEditing ? (
        <Button type="button" className="w-full sm:w-auto" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
      ) : (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          {startInShowMode && (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                reset();
                setFormError(null);
                setIsEditing(false);
                onCancel?.();
              }}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      )
    ) : null;

  return (
    <form onSubmit={submit} className="flex flex-col">
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        {fields.map((field) => {
          const name = field.name as string;
          const isDisabled = !editing || disabledFields.includes(field.name);
          const fieldError = errors[name as keyof Values];
          const fullWidth = isFullWidthField(field as FieldConfig<unknown>);

          return (
            <div
              key={name}
              className={cn("space-y-1.5", fullWidth && "sm:col-span-2")}
            >
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
                <div className="flex min-h-10 items-center gap-3 rounded-lg border border-border bg-white/[0.02] px-3 py-2">
                  <Switch
                    id={name}
                    checked={Boolean(watch(name as never))}
                    disabled={isDisabled}
                    onCheckedChange={(checked) =>
                      setValue(name as never, checked as never, { shouldValidate: true })
                    }
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
                  onValueChange={(value) =>
                    setValue(name as never, value as never, { shouldValidate: true })
                  }
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
                  onChange={(value) =>
                    setValue(name as never, value as never, { shouldValidate: true })
                  }
                />
              )}

              {field.type === "multiselect-ref" && (
                <MultiSelectField
                  id={name}
                  disabled={isDisabled}
                  value={(watch(name as never) as unknown as string[]) ?? []}
                  options={field.referenceOptions ?? []}
                  onChange={(value) =>
                    setValue(name as never, value as never, { shouldValidate: true })
                  }
                />
              )}

              {field.type === "select-ref" && (
                <SingleSelectField
                  id={name}
                  disabled={isDisabled}
                  value={(watch(name as never) as unknown as string | null) ?? null}
                  options={field.referenceOptions ?? []}
                  onChange={(value) =>
                    setValue(name as never, value as never, { shouldValidate: true })
                  }
                />
              )}

              {field.type === "image" && field.imageFolder && (
                <ImageUploadField
                  id={name}
                  disabled={isDisabled}
                  folder={field.imageFolder}
                  required={field.required}
                  slug={
                    field.imageSlug ??
                    sanitizeMediaSlug(
                      String(watch((field.imageSlugFrom ?? field.name) as never) ?? ""),
                    )
                  }
                  value={(watch(name as never) as unknown as string | null) ?? null}
                  onChange={(value) =>
                    setValue(name as never, (value ?? "") as never, { shouldValidate: true })
                  }
                />
              )}

              {field.type === "suggest-text" && field.referenceOptions && (
                <datalist id={`${name}-suggestions`}>
                  {field.referenceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} />
                  ))}
                </datalist>
              )}

              {field.helpText && (
                <p className="text-xs leading-relaxed text-muted-foreground">{field.helpText}</p>
              )}
              {fieldError && (
                <p className="text-sm text-destructive" role="alert">
                  {String(fieldError.message ?? "Invalid value.")}
                </p>
              )}
            </div>
          );
        })}

        {children ? (
          <div className="sm:col-span-2">
            {typeof children === "function" ? children({ isEditing: editing }) : children}
          </div>
        ) : null}
      </div>

      {formError && (
        <p
          className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {formError}
        </p>
      )}

      {actions ? (
        <div
          className={cn(
            "mt-6",
            stickyActions &&
              "sticky bottom-0 z-10 -mx-5 mt-8 border-t border-border bg-canvas-deep/95 px-5 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          )}
        >
          {actions}
        </div>
      ) : null}
    </form>
  );
}
