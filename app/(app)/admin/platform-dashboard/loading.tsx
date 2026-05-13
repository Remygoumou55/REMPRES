import { Skeleton } from "@/components/ui/skeleton";
import { ModulePageStack } from "@/components/ui/module-page-stack";

export default function AdminPlatformDashboardLoading() {
  return (
    <div className="page-wrapper">
      <ModulePageStack className="space-y-4">
        <Skeleton className="h-20 w-full rounded-card" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-card" />
          ))}
        </div>
      </ModulePageStack>
    </div>
  );
}