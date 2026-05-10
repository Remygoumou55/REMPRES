import type { ReactNode } from "react";

/** Enveloppe workflows CRM / approvals — extension sans duplication du moteur governance. */
export function CrmWorkflowShell({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}
