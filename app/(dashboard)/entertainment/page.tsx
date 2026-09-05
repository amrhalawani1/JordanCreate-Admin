import { getEntertainment } from "@/actions/entertainment";
import { PageHeader } from "@/components/layout/PageHeader";
import { EntertainmentClient } from "./EntertainmentClient";

export default async function EntertainmentPage() {
  const acts = await getEntertainment();

  return (
    <div>
      <PageHeader
        eyebrow="06 / Entertainment"
        title="Entertainment"
        description={`${acts.length} act${acts.length === 1 ? "" : "s"} lined up for the event.`}
      />
      <EntertainmentClient initialData={acts} />
    </div>
  );
}
