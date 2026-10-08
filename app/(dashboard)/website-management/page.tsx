import { createAdminClient } from "@/lib/supabase/admin";
import { liveTable } from "@/lib/live-tables";
import { getHomepageSpeakerOrder } from "@/actions/website-settings";
import { HOMEPAGE_SPEAKER_LIMIT, orderForHomepage } from "@/lib/website/homepage-order";
import { WEBSITE_ORIGIN } from "@/lib/previews/speaker-preview-url";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import type { Speaker } from "@/types/entities";
import { HomepageOrderClient } from "./HomepageOrderClient";

export default async function WebsiteManagementPage() {
  const supabase = createAdminClient();
  const [{ data, error }, savedOrder] = await Promise.all([
    supabase.from(liveTable("speakers")).select("*").eq("archived", false),
    getHomepageSpeakerOrder(),
  ]);
  if (error) throw new Error(error.message);
  const live = (data ?? []) as Speaker[];
  const ordered = orderForHomepage(live, savedOrder);

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Website Management"
        description={
          <>
            Control what visitors see on{" "}
            <a href={WEBSITE_ORIGIN} target="_blank" rel="noreferrer" className="text-orange underline-offset-4 hover:underline">
              jordancreate.com
            </a>
            . Home-page speakers is the first section; more will land here.
          </>
        }
      />

      <section className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">Home-page speakers</h2>
            <Badge variant="secondary">
              {Math.min(ordered.length, HOMEPAGE_SPEAKER_LIMIT)} shown · {ordered.length} live
            </Badge>
          </div>
          <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
            {`The home page shows the first ${HOMEPAGE_SPEAKER_LIMIT} speakers in this order, then an "All speakers" button.`} The full list on the Speakers page is unaffected. Archived speakers never
            appear; a newly added speaker joins the end of the list until you move it.
          </p>
        </div>

        <HomepageOrderClient
          initial={ordered.map((s) => ({
            handle: s.handle,
            photo_url: s.photo_url,
            followers_range: s.followers_range,
            category: s.category,
          }))}
          savedOrder={savedOrder}
          limit={HOMEPAGE_SPEAKER_LIMIT}
          websiteOrigin={WEBSITE_ORIGIN}
        />
      </section>
    </div>
  );
}
