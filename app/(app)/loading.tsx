import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

/** Chargement du contenu principal uniquement — la coque AppShell reste affichée. */
export default function AppSegmentLoading() {
  return <RouteLoadingShell />;
}
