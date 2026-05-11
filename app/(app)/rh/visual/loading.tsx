import { Skeleton } from "@/components/ui/skeleton";

export default function RhVisualLoading() {
  return (
    <div className="page-wrapper space-y-4">
      <Skeleton className="h-20 w-full rounded-card" />
      <Skeleton className="h-40 w-full rounded-card" />
      <Skeleton className="h-56 w-full rounded-card" />
      <Skeleton className="h-80 w-full rounded-card" />
    </div>
  );
}
