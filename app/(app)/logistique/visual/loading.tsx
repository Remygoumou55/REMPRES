import { Skeleton } from "@/components/ui/skeleton";

export default function LogisticsVisualLoading() {
  return (
    <div className="page-wrapper">
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-card" />
        <Skeleton className="h-48 w-full rounded-card" />
        <Skeleton className="h-64 w-full rounded-card" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    </div>
  );
}
