import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      <div className="mb-8 border-b border-white/10 pb-6">
        <Skeleton className="h-3 w-24 rounded-[4px]" />
        <Skeleton className="mt-4 h-9 w-56 rounded-[4px]" />
        <Skeleton className="mt-3 h-4 w-80 rounded-[4px]" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-[4px]" />
        ))}
      </div>
    </div>
  );
}
