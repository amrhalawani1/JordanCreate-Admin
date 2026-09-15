import { getBroadcasts } from "@/actions/broadcasts";
import { PageHeader } from "@/components/layout/PageHeader";
import { BroadcastsClient } from "./BroadcastsClient";

// Sending to ~2,000 phones is about 20 requests to Expo; allow time for it.
export const maxDuration = 60;

export default async function BroadcastsPage() {
  const { rows, deviceCount, error } = await getBroadcasts();

  return (
    <div>
      <PageHeader
        eyebrow="Guests"
        title="Notifications"
        description="Send a push notification to guests' phones. It reaches everyone who turned on event updates, and every message sent to all guests also stays in the app's notification bell."
      />
      <BroadcastsClient initialData={rows} deviceCount={deviceCount} loadError={error} />
    </div>
  );
}
