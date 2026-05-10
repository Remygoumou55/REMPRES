"use client";

import type { ReactNode } from "react";
import { ComplianceOperationalNav } from "@/modules/compliance/components/dashboard/ComplianceOperationalNav";
import { ComplianceWorkspaceProvider } from "@/modules/compliance/components/dashboard/ComplianceWorkspaceProvider";

export function ComplianceOperationalWorkspace({
  children,
  canOperate,
}: {
  children: ReactNode;
  canOperate: boolean;
}) {
  return (
    <ComplianceWorkspaceProvider canOperate={canOperate}>
      <div className="mx-auto max-w-6xl space-y-5">
        <ComplianceOperationalNav />
        {children}
      </div>
    </ComplianceWorkspaceProvider>
  );
}
