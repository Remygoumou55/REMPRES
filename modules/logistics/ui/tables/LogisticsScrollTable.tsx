import type { ReactNode } from "react";
import { TableShell } from "@/components/ui/table-shell";

export function LogisticsScrollTable({ children }: { children: ReactNode }) {
  return <TableShell>{children}</TableShell>;
}
