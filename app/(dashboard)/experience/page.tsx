import { getExperiences } from "@/actions/experience";
import { ExperienceClient } from "./ExperienceClient";

export default async function ExperiencePage() {
  const experiences = await getExperiences();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Experience</h1>
        <p className="text-sm text-muted-foreground">
          Extra experiences the bot can surface, e.g. the event playlist.
        </p>
      </div>
      <ExperienceClient initialData={experiences} />
    </div>
  );
}
