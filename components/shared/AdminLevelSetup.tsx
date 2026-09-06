"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ADMIN_VIEW_ONLY_SETUP_SQL } from "@/lib/sql/admin-view-only-setup";

export function AdminLevelSetup() {
  const [copied, setCopied] = useState(false);

  async function copySql() {
    await navigator.clipboard.writeText(ADMIN_VIEW_ONLY_SETUP_SQL);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mb-4 rounded-[4px] border border-orange/40 bg-orange/5 p-4">
      <p className="text-sm leading-relaxed text-foreground">
        Admin - View Only needs a one-time database change. Run this in the Supabase SQL Editor,
        then you can assign that level. Existing Admin accounts stay Admin - Full Edit.
      </p>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
        {ADMIN_VIEW_ONLY_SETUP_SQL}
      </pre>
      <Button type="button" variant="outline" className="mt-3" onClick={() => void copySql()}>
        {copied ? "Copied" : "Copy SQL"}
      </Button>
    </div>
  );
}
