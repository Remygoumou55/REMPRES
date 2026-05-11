"use client";

import type { ComponentProps } from "react";
import { DashboardWidgetShell } from "@/modules/dashboard-system/widgets";

export type ExecutiveWidgetShellProps = ComponentProps<typeof DashboardWidgetShell>;

export function ExecutiveWidgetShell(props: ExecutiveWidgetShellProps) {
  return <DashboardWidgetShell {...props} />;
}
