"use client";

import type { ReactNode } from "react";
import { FinanceEnterpriseNav } from "@/modules/finance/components/dashboard/FinanceEnterpriseNav";

export function FinanceEnterpriseWorkspace({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <FinanceEnterpriseNav />
      {children}
    </div>
  );
}
