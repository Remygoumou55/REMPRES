import { Skeleton } from "@/components/ui/skeleton";

export function KpiGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[108px] w-full rounded-2xl" />
      ))}
    </div>
  );
}
