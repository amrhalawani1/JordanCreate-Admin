import { Skeleton } from "@/components/ui/skeleton";

/** First load only; range switches keep the previous figures on screen instead. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading website analytics">
      <div className="mb-6 space-y-3">
        <Skeleton className="h-3 w-20 rounded-[4px]" />
        <Skeleton className="h-8 w-60 rounded-[4px]" />
        <Skeleton className="h-4 w-80 rounded-[4px]" />
      </div>
      <Skeleton className="mb-5 h-10 w-80 rounded-lg" />
      <div className="grid gap-3 lg:grid-cols-3">
        <Skeleton className="h-[372px] rounded-xl lg:col-span-2" />
        <div className="grid gap-3">
          <Skeleton className="h-[180px] rounded-xl" />
          <Skeleton className="h-[180px] rounded-xl" />
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[136px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
