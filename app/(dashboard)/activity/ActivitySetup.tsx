"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ACTIVITY_LOGS_SETUP_SQL } from "@/lib/sql/activity-logs-setup";

export function ActivitySetup() {
  const [copied, setCopied] = useState(false);

  async function copySql() {
    await navigator.clipboard.writeText(ACTIVITY_LOGS_SETUP_SQL);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-[4px] border border-orange/40 bg-orange/5 p-4">
      <p className="text-sm leading-relaxed text-foreground">
        Run this once in the Supabase SQL Editor, then refresh this page.
      </p>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{ACTIVITY_LOGS_SETUP_SQL}</pre>
      <Button type="button" variant="outline" className="mt-3" onClick={() => void copySql()}>
        {copied ? "Copied" : "Copy SQL"}
      </Button>
    </div>
  );
}
