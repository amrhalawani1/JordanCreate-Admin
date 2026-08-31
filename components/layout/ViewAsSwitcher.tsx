"use client";

import { buttonVariants } from "@/components/ui/button";
import { setViewAs } from "@/actions/view-as";
import { ADMIN_LEVEL_LABELS, ADMIN_LEVEL_VALUES, type AdminLevel } from "@/types/entities";
import { cn } from "@/lib/utils";

export function ViewAsSwitcher({ viewLevel }: { viewLevel: AdminLevel }) {
  return (
    <form action={setViewAs}>
      <label className="sr-only" htmlFor="view-as-level">
        View as
      </label>
      <select
        id="view-as-level"
        name="level"
        defaultValue={viewLevel}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "appearance-none pr-8",
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.65rem center",
        }}
      >
        {ADMIN_LEVEL_VALUES.map((level) => (
          <option key={level} value={level}>
            {ADMIN_LEVEL_LABELS[level]}
          </option>
        ))}
      </select>
    </form>
  );
}
