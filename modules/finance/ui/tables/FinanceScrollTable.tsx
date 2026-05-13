import type { ReactNode } from "react";
import { TableShell } from "@/components/ui/table-shell";

export function FinanceScrollTable({
  children,
  emptyLabel,
}: {
  children?: ReactNode;
  emptyLabel?: string;
}) {
  if (emptyLabel != null && children == null) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
        {emptyLabel}
      </div>
    );
  }

  return <TableShell>{children}</TableShell>;
}
