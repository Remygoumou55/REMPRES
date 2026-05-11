"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { DashboardDateRangePreset } from "../../types/domain";
import { DASHBOARD_DATE_PRESET_OPTIONS } from "../../filters/date-presets";
import type { DashboardFilterBarProps } from "../../filters/types";

export function DashboardFoundationFilterBar({ value, onChange, disabled }: DashboardFilterBarProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-card border border-gray-100 bg-white px-4 py-3 text-sm">
      <span className="font-medium text-darktext">{t("dashboard.foundation.filters.title", "Filters")}</span>
      <label className="flex items-center gap-2 text-gray-600">
        <span>{t("dashboard.foundation.filters.period", "Period")}</span>
        <select
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-darktext"
          disabled={disabled}
          value={value.dateRange ?? "30d"}
          onChange={(e) =>
            onChange({
              ...value,
              dateRange: e.target.value as DashboardDateRangePreset,
            })
          }
        >
          {DASHBOARD_DATE_PRESET_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {t(opt.labelKey, opt.id)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
