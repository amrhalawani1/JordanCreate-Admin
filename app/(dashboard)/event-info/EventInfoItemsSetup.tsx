"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EVENT_INFO_ITEMS_SETUP_SQL } from "@/lib/sql/event-info-items-setup";

export function EventInfoItemsSetup() {
  const [copied, setCopied] = useState(false);

  async function copySql() {
    await navigator.clipboard.writeText(EVENT_INFO_ITEMS_SETUP_SQL);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-[4px] border border-orange/40 bg-orange/5 p-4">
      <p className="text-sm leading-relaxed text-foreground">
        Run this once in the Supabase SQL Editor, then refresh this page. Do not change{" "}
        <code>guest_profiles</code> or <code>conversation_messages</code>.
      </p>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
        {EVENT_INFO_ITEMS_SETUP_SQL}
      </pre>
      <Button type="button" variant="outline" className="mt-3" onClick={() => void copySql()}>
        {copied ? "Copied" : "Copy SQL"}
      </Button>
    </div>
  );
}
