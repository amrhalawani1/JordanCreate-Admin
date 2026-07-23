import { getEventInfo } from "@/actions/event-info";
import type { EventInfoFormValues } from "@/lib/validation/event-info";
import { EventInfoForm } from "./EventInfoForm";
import { UpdatedAtBadge } from "@/components/shared/UpdatedAtBadge";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function EventInfoPage() {
  const eventInfo = await getEventInfo();

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
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Event Info</h1>
          <p className="text-sm text-muted-foreground">Core event logistics guests and staff rely on.</p>
        </div>
        <UpdatedAtBadge value={eventInfo.updated_at} />
      </div>
      <EventInfoForm defaultValues={defaultValues} />
    </div>
  );
}
