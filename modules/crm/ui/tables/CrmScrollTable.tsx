import type { ReactNode } from "react";
import { TableShell } from "@/components/ui/table-shell";

export function CrmScrollTable({ children }: { children: ReactNode }) {
  return <TableShell className="border-indigo-100/80">{children}</TableShell>;
}
