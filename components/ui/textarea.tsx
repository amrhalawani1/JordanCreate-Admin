import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-[4px] border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-faint focus-visible:border-orange focus-visible:ring-1 focus-visible:ring-orange/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
