"use client";

import { useState, memo } from "react";
import { Settings2, AlertCircle } from "lucide-react";
import type { FinanceAlertItem, FinanceAlertSettings } from "@/lib/finance-alerts";
import { DEFAULT_ALERT_SETTINGS, saveAlertSettings } from "@/lib/finance-alerts";

export const AlertsSection = memo(function AlertsSection({
  alerts,
  settings,
  onChangeSettings,
}: {
  alerts: FinanceAlertItem[];
  settings: FinanceAlertSettings;
  onChangeSettings: (s: FinanceAlertSettings) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      {alerts.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 transition-all">
          <p className="text-xs font-bold uppercase text-amber-800">Alertes</p>
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  a.level === "critical" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-amber-200 bg-white text-amber-900"
                }`}
              >
                <span className="font-semibold">{a.title}.</span> {a.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Seuils d’alerte (local)
        </button>
        {open && (
          <div className="flex w-full max-w-lg flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-lg">
            <label className="flex flex-col gap-1">
              Seuil dépense max / jour (GNF, 0 = off)
              <input
                type="number"
                className="rounded-lg border border-gray-200 px-2 py-1 outline-none focus:border-primary"
                value={settings.maxDayExpenseGnf || ""}
                onChange={(e) =>
                  onChangeSettings({
                    ...settings,
                    maxDayExpenseGnf: Number(e.target.value) || 0,
                  })
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              Alerte si variation CA &lt; (% vs période préc.)
              <input
                type="number"
                className="rounded-lg border border-gray-200 px-2 py-1 outline-none focus:border-primary"
                value={settings.minRevenueDeltaPct}
                onChange={(e) =>
                  onChangeSettings({ ...settings, minRevenueDeltaPct: Number(e.target.value) || -8 })
                }
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary focus:ring-primary"
                checked={settings.warnNegativeProfit}
                onChange={(e) => onChangeSettings({ ...settings, warnNegativeProfit: e.target.checked })}
              />
              Alerter si résultat négatif
            </label>
            <button
              type="button"
              onClick={() => {
                onChangeSettings({ ...DEFAULT_ALERT_SETTINGS });
                saveAlertSettings({ ...DEFAULT_ALERT_SETTINGS });
              }}
              className="mt-1 text-left text-xs font-semibold text-primary hover:underline"
            >
              Réinitialiser les seuils
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
