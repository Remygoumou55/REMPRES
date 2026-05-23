"use client";

import { BarChart3, type LucideIcon } from "lucide-react";

export type EmptyChartProps = {
  message?: string;
  icon?: LucideIcon;
};

export function EmptyChart({
  message = "Les données apparaîtront ici",
  icon: Icon = BarChart3,
}: EmptyChartProps) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 py-8 text-center">
      <Icon size={24} className="text-gray-400" />
      <p className="text-[13px] italic text-gray-500">{message}</p>
    </div>
  );
}
