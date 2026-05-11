import { Skeleton } from "@/components/ui/skeleton";

export default function ExecutiveDashboardLoading() {
  return (
    <div className="page-wrapper mx-auto max-w-6xl space-y-4">
      <Skeleton className="h-16 w-full rounded-card" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-card" />
        ))}
      </div>
    </div>
  );
}
