import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function LogistiqueLoading() {
  return (
    <div className="page-wrapper" aria-busy="true">
      <RouteLoadingShell label="Chargement logistique…" />
    </div>
  );
}
