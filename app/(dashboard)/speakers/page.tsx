import { getSpeakers } from "@/actions/speakers";
import { SpeakersClient } from "./SpeakersClient";

export default async function SpeakersPage() {
  const speakers = await getSpeakers();
  const missingCount = speakers.filter((s) => s.bio_status === "missing").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Speakers</h1>
        <p className="text-sm text-muted-foreground">
          {speakers.length} speakers
          {missingCount > 0 && (
            <span className="text-warning"> · {missingCount} missing bios</span>
          )}
        </p>
      </div>
      <SpeakersClient initialData={speakers} />
    </div>
  );
}
