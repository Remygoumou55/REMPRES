import type { ReactNode } from "react";

export function FinanceScrollTable({
  children,
  emptyLabel,
}: {
  children?: ReactNode;
  emptyLabel?: string;
}) {
  if (emptyLabel != null && children == null) {
    return (
      <div className="rounded-xl border border-gray-100 p-6 text-center text-sm text-gray-500">{emptyLabel}</div>
    );
  }

  return <div className="overflow-x-auto rounded-xl border border-gray-100">{children}</div>;
}
