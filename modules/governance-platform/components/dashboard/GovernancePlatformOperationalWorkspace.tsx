"use client";

import type { ReactNode } from "react";
import { GovernancePlatformOperationalNav } from "@/modules/governance-platform/components/dashboard/GovernancePlatformOperationalNav";
import { GovernancePlatformWorkspaceProvider } from "@/modules/governance-platform/components/dashboard/GovernancePlatformWorkspaceProvider";

export function GovernancePlatformOperationalWorkspace({
  children,
  canOperate,
}: {
  children: ReactNode;
  canOperate: boolean;
}) {
  return (
    <GovernancePlatformWorkspaceProvider canOperate={canOperate}>
      <div className="mx-auto max-w-6xl space-y-5">
        <GovernancePlatformOperationalNav />
        {children}
      </div>
    </GovernancePlatformWorkspaceProvider>
  );
}
