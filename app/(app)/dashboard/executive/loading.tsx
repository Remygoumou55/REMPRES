import { Skeleton } from "@/components/ui/skeleton";
import { ModulePageStack } from "@/components/ui/module-page-stack";

export default function ExecutiveDashboardLoading() {
  return (
    <div className="page-wrapper">
      <ModulePageStack className="space-y-4">
        <Skeleton className="h-16 w-full rounded-card" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-card" />
          ))}
        </div>
      </ModulePageStack>
    </div>
  );
}