import { getPartners } from "@/actions/partners";
import { getVenueZones } from "@/actions/venue-zones";
import { PageHeader } from "@/components/layout/PageHeader";
import { PartnersClient } from "./PartnersClient";

export default async function PartnersPage() {
  const [partners, zones] = await Promise.all([getPartners(), getVenueZones()]);

  return (
    <div>
      <PageHeader
        eyebrow="04 / Partners"
        title="Partners"
        description={`${partners.length} partner${partners.length === 1 ? "" : "s"} shown across the event.`}
      />
      <PartnersClient initialData={partners} zones={zones} />
    </div>
  );
}
