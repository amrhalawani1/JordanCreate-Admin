"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ChevronsUp, ExternalLink, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoThumb } from "@/components/shared/fields/PhotoThumb";
import { saveHomepageSpeakerOrder } from "@/actions/website-settings";
import { cn } from "@/lib/utils";

export type OrderRow = {
  handle: string;
  photo_url: string | null;
  followers_range: string | null;
  category: string | null;
};

const SEP = "\u0000";

export function HomepageOrderClient({
  initial,
  savedOrder,
  limit,
  websiteOrigin,
}: {
  initial: OrderRow[];
  savedOrder: string[];
  limit: number;
  websiteOrigin: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<OrderRow[]>(initial);
  const [pending, startTransition] = useTransition();

  const initialKey = useMemo(() => initial.map((r) => r.handle).join(SEP), [initial]);
  const dirty = rows.map((r) => r.handle).join(SEP) !== initialKey;
  const hasSavedOrder = savedOrder.length > 0;

  function move(index: number, to: number) {
    if (to < 0 || to >= rows.length || to === index) return;
    setRows((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function save(handles: string[], successMessage: string) {
    startTransition(async () => {
      const result = await saveHomepageSpeakerOrder(handles);
      if (result.success) {
        toast.success(successMessage);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={() => save(rows.map((r) => r.handle), "Home-page order saved. The website updates within seconds.")}
          disabled={!dirty || pending}
        >
          {pending ? "Saving…" : "Save order"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setRows(initial)} disabled={!dirty || pending}>
          Discard changes
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => save([], "Order reset. The website is back to biggest audiences first.")}
          disabled={!hasSavedOrder || pending}
          title="Go back to the website default: biggest audiences first"
        >
          <RotateCcw className="size-4" aria-hidden />
          Reset to default
        </Button>
        <a
          href={`${websiteOrigin}/#lineup`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 text-sm text-orange underline-offset-4 hover:underline"
        >
          Open the home page
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>

      <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-[#0e0d0c]">
        {rows.map((row, index) => {
          const shown = index < limit;
          return (
            <li key={row.handle}>
              {index === limit ? (
                <div className="flex items-center gap-3 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  Not shown on the home page (positions {limit + 1}+)
                  <span className="h-px flex-1 bg-border" />
                </div>
              ) : null}
              <div className={cn("flex items-center gap-3 px-3 py-2.5 sm:px-4", !shown && "opacity-60")}>
                <span className="w-7 shrink-0 text-right font-mono text-xs text-muted-foreground">{index + 1}</span>
                <PhotoThumb src={row.photo_url} alt={row.handle} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.handle}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[row.followers_range, row.category].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(index, 0)} disabled={index === 0 || pending} aria-label={`Move ${row.handle} to the top`} title="Move to top">
                    <ChevronsUp className="size-4" aria-hidden />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(index, index - 1)} disabled={index === 0 || pending} aria-label={`Move ${row.handle} up`} title="Move up">
                    <ArrowUp className="size-4" aria-hidden />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(index, index + 1)} disabled={index === rows.length - 1 || pending} aria-label={`Move ${row.handle} down`} title="Move down">
                    <ArrowDown className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No live speakers. Unarchive speakers on the Speakers page first.</p>
      ) : null}
    </div>
  );
}
