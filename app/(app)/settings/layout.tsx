import { Suspense } from "react";
import { GovernanceChrome } from "@/components/governance/GovernanceChrome";

export default function SettingsModuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="space-y-6">{children}</div>}>
      <GovernanceChrome>{children}</GovernanceChrome>
    </Suspense>
  );
}
