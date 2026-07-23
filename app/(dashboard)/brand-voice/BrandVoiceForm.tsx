"use client";

import { updateBrandVoice } from "@/actions/brand-voice";
import { brandVoiceFields } from "@/lib/entity-configs/brand-voice";
import { BrandVoiceSchema, type BrandVoiceFormValues } from "@/lib/validation/brand-voice";
import { SingletonForm } from "@/components/shared/SingletonForm";

export function BrandVoiceForm({ defaultValues }: { defaultValues: BrandVoiceFormValues }) {
  return (
    <SingletonForm
      fields={brandVoiceFields}
      schema={BrandVoiceSchema}
      defaultValues={defaultValues}
      onSubmit={updateBrandVoice}
      successMessage="Brand voice updated."
    />
  );
}
