import type { ReactNode } from "react";

export function ExecutiveInsightStack({
  children,
  dense = false,
}: {
  children: ReactNode;
  dense?: boolean;
}) {
  return <div className={dense ? "space-y-3" : "space-y-4"}>{children}</div>;
}

