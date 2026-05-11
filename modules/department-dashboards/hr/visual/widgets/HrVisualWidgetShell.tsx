"use client";

import type { ComponentProps } from "react";
import { DashboardWidgetShell } from "@/modules/dashboard-system/widgets";

export type HrVisualWidgetShellProps = ComponentProps<typeof DashboardWidgetShell>;

export function HrVisualWidgetShell(props: HrVisualWidgetShellProps) {
  return <DashboardWidgetShell {...props} />;
}
