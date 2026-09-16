"use client";

import { useEffect, useState } from "react";

export function UpdatedAtBadge({ value }: { value: string | null | undefined }) {
  const [label, setLabel] = useState<string | null>(null);

  // Deliberately client-only: the formatted time depends on the viewer's
  // locale and timezone, which the server render cannot know.
  useEffect(() => {
    if (!value) return;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
