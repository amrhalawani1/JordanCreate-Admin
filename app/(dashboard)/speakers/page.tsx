import { getSpeakers } from "@/actions/speakers";
import { getSpeakerSocialLinks } from "@/actions/speaker-social-links";
import { archiveColumnReady } from "@/actions/archive";
import { getInterestTags } from "@/actions/interest-tags";
import { PageHeader } from "@/components/layout/PageHeader";
import { ArchiveColumnsSetup } from "@/components/shared/ArchiveColumnsSetup";
import { SpeakersClient } from "./SpeakersClient";

export default async function SpeakersPage() {
  const [speakers, socialLinks, archiveReady, interestTags] = await Promise.all([
    getSpeakers(),
    getSpeakerSocialLinks(),
    archiveColumnReady("speakers"),
    getInterestTags().catch(() => []),
  ]);
  const missingCount = speakers.filter((s) => s.bio_status === "missing").length;
  const archivedCount = speakers.filter((s) => s.archived).length;

  return (
    <div>
      <PageHeader
        title="Speakers"
        description={
          <>
            {speakers.length} speakers
            {missingCount > 0 ? (
              <span className="text-orange"> · {missingCount} missing bios</span>
            ) : null}
            {archivedCount > 0 ? ` · ${archivedCount} archived` : null}
          </>
        }
      />
      {archiveReady ? null : <ArchiveColumnsSetup />}
      <SpeakersClient
        initialData={speakers}
        socialLinks={socialLinks}
        tagSuggestions={interestTags.map((t) => t.tag_label).filter((v): v is string => Boolean(v))}
      />
    </div>
  );
}
