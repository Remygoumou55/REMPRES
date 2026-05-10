import type { ReactNode } from "react";

export function CrmScrollTable({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border border-indigo-50">{children}</div>;
}
