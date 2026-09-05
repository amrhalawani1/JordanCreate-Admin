import { getBrandVoice } from "@/actions/brand-voice";
import type { BrandVoiceFormValues } from "@/lib/validation/brand-voice";
import { brandVoiceFields } from "@/lib/entity-configs/brand-voice";
import { fieldValueTable } from "@/lib/export-html";
import { BrandVoiceForm } from "./BrandVoiceForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExportButton } from "@/components/shared/ExportButton";

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
    <div>
      <PageHeader
        eyebrow="08 / Voice"
        title="Brand Voice"
        description="Mission, values, and tone the app and bot should reflect."
        action={
          <ExportButton
            title="Brand Voice"
            fileStem="brand-voice"
            tables={[fieldValueTable(brandVoiceFields, brandVoice)]}
          />
        }
      />
      <BrandVoiceForm defaultValues={defaultValues} />
    </div>
  );
}
