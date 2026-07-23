import { getVenueZones } from "@/actions/venue-zones";
import { VenueZonesClient } from "./VenueZonesClient";

export default async function VenuePage() {
  const zones = await getVenueZones();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Venue Zones</h1>
        <p className="text-sm text-muted-foreground">
          Zones guests are directed to around the venue (Z1–Z5, VIP).
        </p>
      </div>
      <VenueZonesClient initialData={zones} />
    </div>
  );
}
