import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-orange focus-visible:ring-2 focus-visible:ring-orange/30 active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "rounded-lg bg-orange text-[#0a0a0a] shadow-[0_1px_0_rgba(255,255,255,0.12)_inset] hover:bg-orange-hot",
        outline:
          "rounded-lg border-border bg-transparent text-foreground hover:border-white/20 hover:bg-white/[0.04]",
        secondary:
          "rounded-lg bg-secondary text-secondary-foreground hover:bg-white/10",
        ghost:
          "rounded-lg hover:bg-white/[0.06] hover:text-foreground",
        destructive:
          "rounded-lg bg-destructive text-white hover:bg-destructive/85",
        link: "rounded-none px-0 text-orange underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-3.5 text-sm md:h-9",
        xs: "h-7 gap-1 rounded-md px-2.5 text-xs",
        sm: "h-9 gap-1.5 rounded-lg px-3 text-sm md:h-8",
        lg: "h-11 gap-2 rounded-lg px-5 text-sm",
        icon: "size-10 rounded-lg md:size-9",
        "icon-xs": "size-7 rounded-md",
        "icon-sm": "size-9 rounded-lg md:size-8",
        "icon-lg": "size-11 rounded-lg md:size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
