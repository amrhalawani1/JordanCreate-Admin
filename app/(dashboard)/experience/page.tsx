import { getExperiences } from "@/actions/experience";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExperienceClient } from "./ExperienceClient";

export default async function ExperiencePage() {
  const experiences = await getExperiences();

  return (
    <div>
      <PageHeader
        eyebrow="08 / Extra"
        title="Experience"
        description="Extra experiences the app and bot can surface, e.g. the event playlist."
      />
      <ExperienceClient initialData={experiences} />
    </div>
  );
}
