import { getInterestTags } from "@/actions/interest-tags";
import { PageHeader } from "@/components/layout/PageHeader";
import { InterestTagsClient } from "./InterestTagsClient";

export default async function InterestTagsPage() {
  const tags = await getInterestTags();

  return (
    <div>
      <PageHeader
        eyebrow="05 / Matching"
        title="Interest Tags"
        description="Tags used to match guests with relevant agenda sessions."
      />
      <InterestTagsClient initialData={tags} />
    </div>
  );
}
