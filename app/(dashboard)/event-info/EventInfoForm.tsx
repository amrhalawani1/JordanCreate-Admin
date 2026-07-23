"use client";

import { updateEventInfo } from "@/actions/event-info";
import { eventInfoFields } from "@/lib/entity-configs/event-info";
import { EventInfoSchema, type EventInfoFormValues } from "@/lib/validation/event-info";
import { SingletonForm } from "@/components/shared/SingletonForm";

export function EventInfoForm({ defaultValues }: { defaultValues: EventInfoFormValues }) {
  return (
    <SingletonForm
      fields={eventInfoFields}
      schema={EventInfoSchema}
      defaultValues={defaultValues}
      onSubmit={updateEventInfo}
      successMessage="Event info updated."
    />
  );
}
