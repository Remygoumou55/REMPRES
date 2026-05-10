"use client";

import type { ReactNode } from "react";
import { CrmOperationalNav } from "@/modules/crm/components/dashboard/CrmOperationalNav";

export function CrmOperationalWorkspace({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <CrmOperationalNav />
      {children}
    </div>
  );
}
