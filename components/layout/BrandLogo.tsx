import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/logo.png"
      alt="Jordan Create"
      width={188}
      height={56}
      priority={priority}
      className={cn("h-7 w-auto max-w-full object-contain object-left", className)}
    />
  );
}
