import { getFeatureRequests } from "@/actions/feature-requests";
import { PageHeader } from "@/components/layout/PageHeader";
import { RequestFeatureClient } from "./RequestFeatureClient";

export default async function RequestAFeaturePage({
  searchParams,
}: {
  searchParams: Promise<{ compose?: string }>;
}) {
  const [{ rows, error }, params] = await Promise.all([getFeatureRequests(), searchParams]);

  return (
    <div>
      <PageHeader
        eyebrow="12 / Feedback"
        title="Request a Feature"
        description="This admin feeds the app and the bot. Ask for missing data, or a capability neither of them has yet."
      />
      <RequestFeatureClient
        initialData={rows}
        loadError={error}
        compose={params.compose === "1"}
      />
    </div>
  );
}
