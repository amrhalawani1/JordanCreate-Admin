"use client";

import { buttonVariants } from "@/components/ui/button";
import { setViewAs } from "@/actions/view-as";
import { ADMIN_LEVEL_LABELS, ADMIN_LEVEL_VALUES, type AdminLevel } from "@/types/entities";
import { cn } from "@/lib/utils";

export function ViewAsSwitcher({
  viewLevel,
  id = "view-as-level",
  fullWidth = false,
}: {
  viewLevel: AdminLevel;
  id?: string;
  fullWidth?: boolean;
}) {
  return (
    <form action={setViewAs} className={fullWidth ? "w-full" : undefined}>
      <label
        className={
          fullWidth
            ? "mb-1.5 block font-[family-name:var(--font-ui)] text-xs tracking-wide text-muted-foreground"
            : "sr-only"
        }
        htmlFor={id}
      >
        View as
      </label>
      <select
        id={id}
        name="level"
        defaultValue={viewLevel}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "appearance-none pr-8",
          fullWidth && "w-full justify-between",
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
