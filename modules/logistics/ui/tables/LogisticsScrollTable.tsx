import type { ReactNode } from "react";

export function LogisticsScrollTable({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border border-gray-100">{children}</div>;
}
