import { getInterestTags } from "@/actions/interest-tags";
import { InterestTagsClient } from "./InterestTagsClient";

export default async function InterestTagsPage() {
  const tags = await getInterestTags();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Interest Tags</h1>
        <p className="text-sm text-muted-foreground">
          Tags used to match guests with relevant agenda sessions.
        </p>
      </div>
      <InterestTagsClient initialData={tags} />
    </div>
  );
}
