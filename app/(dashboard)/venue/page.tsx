import { getVenueZones } from "@/actions/venue-zones";
import { getEventInfo } from "@/actions/event-info";
import { PageHeader } from "@/components/layout/PageHeader";
import { VenueMapCard } from "@/components/venue/VenueMapCard";
import { VenueZonesClient } from "./VenueZonesClient";

export default async function VenuePage() {
  const [zones, eventInfo] = await Promise.all([getVenueZones(), getEventInfo()]);

  return (
    <div>
      <PageHeader
        title="Venue"
        description="The venue map and the zones guests are directed to (Z1–Z5, VIP) on the app's Venue screen."
      />
      <VenueMapCard mapUrl={eventInfo?.venue_map_url ?? null} />
      <VenueZonesClient initialData={zones} />
    </div>
  );
}
