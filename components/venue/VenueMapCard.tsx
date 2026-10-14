"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Map as MapIcon } from "lucide-react";
import { setVenueMap } from "@/actions/event-info";
import { ImageUploadField } from "@/components/shared/fields/ImageUploadField";
import { useAdminAccess } from "@/components/layout/AdminAccessProvider";

/** Venue maps are read zoomed in on phones, so keep far more detail than a portrait. */
const MAP_MAX_EDGE = 3200;

/**
 * The picture on the app's Venue screen ("Know where to go."). Saving is
 * immediate: an upload or a removal goes live in the app on its next refresh.
 */
export function VenueMapCard({ mapUrl }: { mapUrl: string | null }) {
  const router = useRouter();
  const { canEdit } = useAdminAccess();
  const [current, setCurrent] = useState(mapUrl);
  const [saving, startSaving] = useTransition();

  function save(next: string | null) {
    const previous = current;
    setCurrent(next);
    startSaving(async () => {
      const result = await setVenueMap(next);
      if (!result.success) {
        setCurrent(previous);
        toast.error(result.error);
        return;
      }
      toast.success(next ? "Venue map updated. The app shows it on its next refresh." : "Venue map removed. The app shows its built-in map.");
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="venue-map-title" className="mb-6 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 id="venue-map-title" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <MapIcon className="size-4 text-orange" aria-hidden />
            Venue map
          </h2>
          <p className="max-w-[62ch] text-sm text-muted-foreground">
            The picture on the app&apos;s Venue screen. Guests pinch to zoom, so upload a sharp, high-resolution
            image. Changes go live in the app as soon as you save.
          </p>
        </div>
        {saving ? <p className="text-xs text-muted-foreground" aria-live="polite">Saving…</p> : null}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-white/[0.02]">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element -- full-size preview of an uploaded map, not a layout image
          <img src={current} alt="Current venue map" className="mx-auto block max-h-[420px] w-full object-contain" />
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center gap-1 px-6 py-10 text-center">
            <p className="text-sm font-medium text-foreground">The app is showing its built-in map</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Upload a map to replace it. Remove it later and the app goes back to the built-in one.
            </p>
          </div>
        )}
      </div>

      <div className="mt-3">
        <ImageUploadField
          id="venue-map"
          value={current}
          folder="venue"
          slug="venue-map"
          maxEdge={MAP_MAX_EDGE}
          disabled={!canEdit || saving}
          onChange={save}
        />
      </div>
    </section>
  );
}
