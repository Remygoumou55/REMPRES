import { Suspense } from "react";
import { GovernanceChrome } from "@/components/governance/GovernanceChrome";

/**
 * Administration — espacement vertical unifié (sans fil d’Ariane dupliqué : le shell porte le contexte).
 * Bandeaux gouvernance Actions / Archives selon le chemin.
 */
export default function AdminModuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="space-y-6">{children}</div>}>
      <GovernanceChrome>{children}</GovernanceChrome>
    </Suspense>
  );
}
