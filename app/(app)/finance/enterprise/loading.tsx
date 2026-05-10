import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function FinanceEnterpriseLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <RouteLoadingShell label="Chargement Finance Enterprise…" />
    </div>
  );
}
