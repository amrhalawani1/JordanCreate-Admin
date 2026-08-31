import { getVenueZones } from "@/actions/venue-zones";
import { PageHeader } from "@/components/layout/PageHeader";
import { VenueZonesClient } from "./VenueZonesClient";

export default async function VenuePage() {
  const zones = await getVenueZones();

  return (
    <div>
      <PageHeader
        eyebrow="04 / Venue"
        title="Venue Zones"
        description="Zones guests are directed to around the venue (Z1–Z5, VIP)."
      />
      <VenueZonesClient initialData={zones} />
    </div>
  );
}
