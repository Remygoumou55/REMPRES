"use client";

import type { ReactNode } from "react";
import { EcosystemOperationalNav } from "@/modules/ecosystem/components/dashboard/EcosystemOperationalNav";
import { EcosystemWorkspaceProvider } from "@/modules/ecosystem/components/dashboard/EcosystemWorkspaceProvider";

export function EcosystemOperationalWorkspace({
  children,
  canOperate,
}: {
  children: ReactNode;
  canOperate: boolean;
}) {
  return (
    <EcosystemWorkspaceProvider canOperate={canOperate}>
      <div className="mx-auto max-w-6xl space-y-5">
        <EcosystemOperationalNav />
        {children}
      </div>
    </EcosystemWorkspaceProvider>
  );
}
