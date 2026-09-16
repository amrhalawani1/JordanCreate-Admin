import { getEntertainment } from "@/actions/entertainment";
import { getInterestTags } from "@/actions/interest-tags";
import { PageHeader } from "@/components/layout/PageHeader";
import { EntertainmentClient } from "./EntertainmentClient";

export default async function EntertainmentPage() {
  const [acts, tags] = await Promise.all([getEntertainment(), getInterestTags()]);

  return (
    <div>
      <PageHeader
        title="Entertainment"
        description={`${acts.length} act${acts.length === 1 ? "" : "s"} lined up for the event.`}
      />
      <EntertainmentClient initialData={acts} tags={tags} />
    </div>
  );
}
