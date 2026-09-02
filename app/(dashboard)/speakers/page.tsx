import { getSpeakers } from "@/actions/speakers";
import { getSpeakerSocialLinks } from "@/actions/speaker-social-links";
import { PageHeader } from "@/components/layout/PageHeader";
import { SpeakersClient } from "./SpeakersClient";

export default async function SpeakersPage() {
  const [speakers, socialLinks] = await Promise.all([getSpeakers(), getSpeakerSocialLinks()]);
  const missingCount = speakers.filter((s) => s.bio_status === "missing").length;

  return (
    <div>
      <PageHeader
        eyebrow="03 / Voices"
        title="Speakers"
        description={
          <>
            {speakers.length} speakers
            {missingCount > 0 ? (
              <span className="text-orange"> · {missingCount} missing bios</span>
            ) : null}
          </>
        }
      />
      <SpeakersClient initialData={speakers} socialLinks={socialLinks} />
    </div>
  );
}
