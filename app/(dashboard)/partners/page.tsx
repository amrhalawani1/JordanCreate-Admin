import { getPartners } from "@/actions/partners";
import { getVenueZones } from "@/actions/venue-zones";
import { archiveColumnReady } from "@/actions/archive";
import { PageHeader } from "@/components/layout/PageHeader";
import { ArchiveColumnsSetup } from "@/components/shared/ArchiveColumnsSetup";
import { PartnersClient } from "./PartnersClient";

export default async function PartnersPage() {
  const [partners, zones, archiveReady] = await Promise.all([
    getPartners(),
    getVenueZones(),
    archiveColumnReady("partners"),
  ]);
  const archivedCount = partners.filter((partner) => partner.archived).length;

  return (
    <div>
      <PageHeader
        title="Sponsors"
        description={`${partners.length} sponsor${partners.length === 1 ? "" : "s"} shown across the event${
          archivedCount > 0 ? ` · ${archivedCount} archived` : ""
        }.`}
      />
      {archiveReady ? null : <ArchiveColumnsSetup />}
      <PartnersClient initialData={partners} zones={zones} />
    </div>
  );
}
