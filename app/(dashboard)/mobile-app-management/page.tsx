import { getHotTopics } from "@/actions/hot-topics";
import { getEntertainment } from "@/actions/entertainment";
import { getAgendaSessions } from "@/actions/agenda-sessions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { STATIC_DESTINATIONS, type DestinationOption } from "@/lib/mobile-app/destinations";
import { HotTopicCard } from "./HotTopicCard";
import { HotTopicsClient } from "./HotTopicsClient";

export default async function MobileAppManagementPage() {
  const [topics, acts, sessions] = await Promise.all([getHotTopics(), getEntertainment(), getAgendaSessions()]);

  const destinationOptions: DestinationOption[] = [
    ...acts.map((act) => ({ value: `entertainment-${act.id}`, label: `Act: ${act.title}` })),
    ...sessions.map((session) => ({ value: `session-${session.session_id}`, label: `Session: ${session.title}` })),
    ...STATIC_DESTINATIONS.map((option) => ({ value: option.value, label: `Screen: ${option.label}` })),
  ];

  const published = topics.filter((topic) => topic.status === "published");

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Mobile App Management"
        description="Control what guests see on the Jordan Create app's Home screen. Hot Topics is the first section; more will land here."
      />

      <section className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">Hot Topics</h2>
            <Badge variant="secondary">
              {published.length} live · {topics.length - published.length} draft
            </Badge>
          </div>
          <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
            The carousel at the top of Home. Guests see published cards in this order; drafts stay here.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-[#0e0d0c] p-4">
          <p className="jc-label mb-3">Preview — as seen in the app</p>
          {published.length > 0 ? (
            <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2">
              {published.map((topic) => (
                <HotTopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing published yet. The app falls back to the confirmed entertainment acts until a card is published.
            </p>
          )}
        </div>

        <HotTopicsClient initialData={topics} destinationOptions={destinationOptions} />
      </section>
    </div>
  );
}
