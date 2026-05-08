import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function RhLoading() {
  return (
    <div className="page-wrapper">
      <RouteLoadingShell label="Chargement de l'espace RH..." />
    </div>
  );
}

