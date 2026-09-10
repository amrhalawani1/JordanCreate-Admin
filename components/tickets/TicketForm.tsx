"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { ManualTicketSchema, type ManualTicketFormValues } from "@/lib/validation/tickets";
import { TICKET_TYPE_LABELS, TICKET_TYPE_VALUES, type TicketQueueRow } from "@/types/entities";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAdminAccess } from "@/components/layout/AdminAccessProvider";

const EMPTY: ManualTicketFormValues = {
  holder_name: "",
  customer_name: "",
  phone: "",
  email: "",
  ticket_ref: "",
  ticket_type: "general",
  gate_token: "",
};

export function TicketForm({
  row,
  onSubmit,
  onSuccess,
  submitLabel,
}: {
  row?: TicketQueueRow | null;
  onSubmit: (values: ManualTicketFormValues) => Promise<{ success: boolean; error?: string }>;
  onSuccess: () => void;
  submitLabel: string;
}) {
  const { canEditTickets } = useAdminAccess();
  const [formError, setFormError] = useState<string | null>(null);
  const isCreate = !row;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ManualTicketFormValues>({
    resolver: zodResolver(ManualTicketSchema) as Resolver<ManualTicketFormValues>,
    defaultValues: row
      ? {
          holder_name: row.holder_name ?? "",
          customer_name: row.customer_name ?? "",
          phone: row.phone ?? "",
          email: row.email ?? "",
          ticket_ref: row.ticket_ref ?? "",
          ticket_type: (TICKET_TYPE_VALUES as readonly string[]).includes(row.ticket_type ?? "")
            ? (row.ticket_type as ManualTicketFormValues["ticket_type"])
            : "general",
          gate_token: "",
        }
      : EMPTY,
  });

  const ticketType = watch("ticket_type");

  if (!canEditTickets) {
    return <p className="text-sm text-muted-foreground">You can look, but you cannot save changes.</p>;
  }

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await onSubmit(values);
    if (result.success) onSuccess();
    else setFormError(result.error ?? "Something went wrong while saving.");
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Attendee name" htmlFor="holder_name" error={errors.holder_name?.message}>
        <Input id="holder_name" dir="auto" placeholder="The person who will enter" {...register("holder_name")} />
      </Field>
      <Field
        label="Buyer name"
        htmlFor="customer_name"
        error={errors.customer_name?.message}
        hint="Only needed when someone else paid."
      >
        <Input id="customer_name" dir="auto" {...register("customer_name")} />
      </Field>
      <Field label="Phone" htmlFor="phone" error={errors.phone?.message} required hint="Jordan numbers can be typed as 07XXXXXXXX.">
        <Input id="phone" inputMode="tel" autoComplete="tel" required {...register("phone")} />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label="Ticket reference" htmlFor="ticket_ref" error={errors.ticket_ref?.message} required>
        <Input id="ticket_ref" required {...register("ticket_ref")} />
      </Field>
      <div className="space-y-1.5">
        <Label htmlFor="ticket_type">
          Ticket type <span className="text-destructive">*</span>
        </Label>
        <Select
          value={ticketType}
          onValueChange={(value) => {
            if (value) setValue("ticket_type", value as ManualTicketFormValues["ticket_type"]);
          }}
        >
          <SelectTrigger id="ticket_type" className="w-full">
            <SelectValue>{TICKET_TYPE_LABELS[ticketType] ?? ticketType}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TICKET_TYPE_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {TICKET_TYPE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isCreate ? (
        <Field
          label="Gate token"
          htmlFor="gate_token"
          error={errors.gate_token?.message}
          hint="Leave blank to send this ticket to the approval queue. Fill it only if this person needs access now."
        >
          <Input id="gate_token" autoComplete="off" {...register("gate_token")} />
        </Field>
      ) : null}

      {formError ? (
        <p className="rounded-[4px] bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
