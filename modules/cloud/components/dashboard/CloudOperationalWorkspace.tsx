"use client";

import type { ReactNode } from "react";
import { CloudOperationalNav } from "@/modules/cloud/components/dashboard/CloudOperationalNav";
import { CloudWorkspaceProvider } from "@/modules/cloud/components/dashboard/CloudWorkspaceProvider";

export function CloudOperationalWorkspace({
  children,
  canOperate,
}: {
  children: ReactNode;
  canOperate: boolean;
}) {
  return (
    <CloudWorkspaceProvider canOperate={canOperate}>
      <div className="mx-auto max-w-6xl space-y-5">
        <CloudOperationalNav />
        {children}
      </div>
    </CloudWorkspaceProvider>
  );
}
