import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function FinanceEnterpriseLoading() {
  return (
    <div className="page-wrapper" aria-busy="true">
      <RouteLoadingShell label="Chargement Finance Enterprise…" />
    </div>
  );
}
