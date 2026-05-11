import type { ReactNode } from "react";

export type DashboardGridProps = {
  children: ReactNode;
  columns?: "sm1_md2_lg3" | "sm1_md2_lg4";
};

const COL_CLASS: Record<NonNullable<DashboardGridProps["columns"]>, string> = {
  sm1_md2_lg3: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  sm1_md2_lg4: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
};

/** Grille responsive pour compositions dashboard sans imposer une sidebar dédiée. */
export function DashboardGrid({ children, columns = "sm1_md2_lg4" }: DashboardGridProps) {
  return <div className={COL_CLASS[columns]}>{children}</div>;
}
