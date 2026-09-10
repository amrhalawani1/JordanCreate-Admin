import { getEventInfo } from "@/actions/event-info";
import { getEventInfoItems } from "@/actions/event-info-items";
import type { EventInfoFormValues } from "@/lib/validation/event-info";
import { eventInfoFields } from "@/lib/entity-configs/event-info";
import { eventInfoItemConfig } from "@/lib/entity-configs/event-info-items";
import { columnsForHtmlExport, fieldValueTable, rowsForHtmlExport } from "@/lib/export-html";
import { EventInfoForm } from "./EventInfoForm";
import { EventInfoItemsClient } from "./EventInfoItemsClient";
import { PageHeader } from "@/components/layout/PageHeader";
import { UpdatedAtBadge } from "@/components/shared/UpdatedAtBadge";
import { ExportButton } from "@/components/shared/ExportButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EventInfoItemsSetup } from "./EventInfoItemsSetup";

export default async function EventInfoPage() {
  const [eventInfo, extra] = await Promise.all([getEventInfo(), getEventInfoItems()]);

  if (!eventInfo) {
    return <EmptyState message="event_info row is missing from the database." />;
  }

  const defaultValues: EventInfoFormValues = {
    event_name: eventInfo.event_name,
    event_date: eventInfo.event_date,
    doors_open_time: eventInfo.doors_open_time,
    estimated_end_time: eventInfo.estimated_end_time,
    venue_name: eventInfo.venue_name,
    venue_address: eventInfo.venue_address,
    google_maps_link: eventInfo.google_maps_link ?? "",
    dress_code: eventInfo.dress_code,
    weather_notes: eventInfo.weather_notes,
    guest_count: eventInfo.guest_count,
    rsvp_link: eventInfo.rsvp_link,
    parking_info: eventInfo.parking_info,
    wifi_network: eventInfo.wifi_network,
    wifi_password: eventInfo.wifi_password ?? "",
    prayer_space_info: eventInfo.prayer_space_info,
    emergency_contact: eventInfo.emergency_contact,
  };

  return (
    <div className="space-y-10">
      <PageHeader
        title="Event Info"
        description="Core event logistics guests and staff rely on. Add extra title-and-description facts below for the app and the bot."
        action={
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
            <UpdatedAtBadge value={eventInfo.updated_at} />
            <ExportButton
              title="Event Info"
              fileStem="event-info"
              tables={[
                fieldValueTable(eventInfoFields, eventInfo, [
                  { label: "Last updated", value: eventInfo.updated_at },
                ]),
                {
                  caption: "Additional info",
                  columns: columnsForHtmlExport(eventInfoItemConfig),
                  rows: rowsForHtmlExport(eventInfoItemConfig, extra.rows),
                },
              ]}
            />
          </div>
        }
      />
      <EventInfoForm defaultValues={defaultValues} />

      <section>
        <h2 className="jc-label">Additional info</h2>
        <p className="mt-2 mb-4 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
          Anything that does not fit the fields above. Each item is a title and a description the app and the bot can use.
        </p>
        {extra.needsSetup ? (
          <EventInfoItemsSetup />
        ) : extra.error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{extra.error}</AlertDescription>
          </Alert>
        ) : (
          <EventInfoItemsClient initialData={extra.rows} />
        )}
      </section>
    </div>
  );
}
