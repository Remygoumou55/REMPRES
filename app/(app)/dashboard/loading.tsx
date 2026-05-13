import { RouteLoadingShell } from "@/components/ui/route-loading-shell";
import { ModulePageStack } from "@/components/ui/module-page-stack";

export default function DashboardLoading() {
  return (
    <div className="page-wrapper">
      <ModulePageStack className="max-w-5xl">
        <RouteLoadingShell />
      </ModulePageStack>
    </div>
  );
}
