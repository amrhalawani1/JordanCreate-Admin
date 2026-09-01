"use client";

import { useEffect, useState } from "react";

export function UpdatedAtBadge({ value }: { value: string | null | undefined }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!value) return;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return;
    setLabel(
      date.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    );
  }, [value]);

  if (!value) return null;

  return (
    <span className="text-sm text-faint md:text-xs">{label ? `Updated ${label}` : "Updated"}</span>
  );
}
