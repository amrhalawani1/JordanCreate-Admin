import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-orange focus-visible:ring-1 focus-visible:ring-orange/40 active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-orange text-[#0a0a0a] uppercase tracking-[0.12em] hover:bg-orange-hot",
        outline:
          "rounded-full border-white/70 bg-transparent text-foreground uppercase tracking-[0.12em] hover:bg-white/5",
        secondary:
          "rounded-full bg-secondary text-secondary-foreground uppercase tracking-[0.12em] hover:bg-white/10",
        ghost:
          "rounded-[4px] hover:bg-muted hover:text-foreground",
        destructive:
          "rounded-full bg-destructive text-white uppercase tracking-[0.12em] hover:bg-destructive/85",
        link: "rounded-none text-orange uppercase tracking-[0.12em] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-2 px-5 text-xs md:h-9",
        xs: "h-6 gap-1 px-3 text-[0.65rem]",
        sm: "h-11 gap-1.5 px-4 text-[0.7rem] md:h-8",
        lg: "h-11 gap-2 px-6 text-xs",
        icon: "size-11 rounded-[4px] md:size-8",
        "icon-xs": "size-6 rounded-[4px]",
        "icon-sm": "size-10 rounded-[4px] md:size-7",
        "icon-lg": "size-11 rounded-[4px] md:size-9",
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
