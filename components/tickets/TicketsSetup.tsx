"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TICKETS_SETUP_SQL } from "@/lib/sql/tickets-setup";
import { SEED_DUMMY_TICKETS_SQL } from "@/lib/sql/seed-dummy-tickets";

export function TicketsSetup({ compact = false }: { compact?: boolean }) {
  const [copiedSetup, setCopiedSetup] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);

  async function copy(text: string, which: "setup" | "seed") {
    await navigator.clipboard.writeText(text);
    if (which === "setup") {
      setCopiedSetup(true);
      window.setTimeout(() => setCopiedSetup(false), 2000);
    } else {
      setCopiedSeed(true);
      window.setTimeout(() => setCopiedSeed(false), 2000);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[4px] border border-orange/40 bg-orange/5 p-4">
        <p className="text-sm leading-relaxed text-foreground">
          {compact ? (
            <>
              The queue is live. Run this SQL once so Postgres enforces approve/reject permissions,
              hides the gate credential behind a view, and blocks webhook overwrites of manual rows.
            </>
          ) : (
            <>
              Run this once in the Supabase SQL Editor, then refresh this page. It adds the approval
              columns, locks <code>qr_token</code> away from anon/authenticated, and installs the
              approve/reject functions. Do not change <code>guest_profiles</code> or{" "}
              <code>conversation_messages</code>.
            </>
          )}
        </p>
        {compact ? (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-foreground">Setup SQL</summary>
            <pre className="mt-3 max-h-64 overflow-x-auto overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
              {TICKETS_SETUP_SQL}
            </pre>
          </details>
        ) : (
          <pre className="mt-3 max-h-80 overflow-x-auto overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
            {TICKETS_SETUP_SQL}
          </pre>
        )}
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          onClick={() => void copy(TICKETS_SETUP_SQL, "setup")}
        >
          {copiedSetup ? "Copied" : "Copy setup SQL"}
        </Button>
      </div>

      {compact ? null : (
        <div className="rounded-[4px] border border-border bg-card p-4">
          <p className="text-sm leading-relaxed text-foreground">
            Optional dummy rows for the queue cases (Arabic name, wrapping name, null holder, no
            email, non-Jordanian phone, conflict pair, group order, group-order warning, approved,
            rejected). Run after setup. Safe to re-run: it skips existing <code>ticket_ref</code>{" "}
            values.
          </p>
          <pre className="mt-3 max-h-64 overflow-x-auto overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
            {SEED_DUMMY_TICKETS_SQL}
          </pre>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => void copy(SEED_DUMMY_TICKETS_SQL, "seed")}
          >
            {copiedSeed ? "Copied" : "Copy dummy seed SQL"}
          </Button>
        </div>
      )}
    </div>
  );
}
