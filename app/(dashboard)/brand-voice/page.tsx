import { getBrandVoice, updateBrandVoice } from "@/actions/brand-voice";
import { brandVoiceFields } from "@/lib/entity-configs/brand-voice";
import { BrandVoiceSchema, type BrandVoiceFormValues } from "@/lib/validation/brand-voice";
import { SingletonForm } from "@/components/shared/SingletonForm";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function BrandVoicePage() {
  const brandVoice = await getBrandVoice();

  if (!brandVoice) {
    return <EmptyState message="brand_voice row is missing from the database." />;
  }

  const defaultValues: BrandVoiceFormValues = {
    mission: brandVoice.mission,
    values_text: brandVoice.values_text,
    tone_notes: brandVoice.tone_notes ?? "",
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Brand Voice</h1>
        <p className="text-sm text-muted-foreground">
          Mission, values, and tone the bot's copy should reflect.
        </p>
      </div>
      <SingletonForm
        fields={brandVoiceFields}
        schema={BrandVoiceSchema}
        defaultValues={defaultValues}
        onSubmit={updateBrandVoice}
        successMessage="Brand voice updated."
      />
    </div>
  );
}
