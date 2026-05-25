"use client";

import type { ReactNode } from "react";
import { OperationsOperationalNav } from "@/modules/operations/components/dashboard/OperationsOperationalNav";

export function OperationsOperationalWorkspace({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <OperationsOperationalNav />
      {children}
    </div>
  );
}
