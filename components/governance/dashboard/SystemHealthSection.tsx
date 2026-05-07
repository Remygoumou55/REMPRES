"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { GovernanceSystemHealth } from "@/lib/governance/kpi/aggregate-kpi";

type SystemHealthSectionProps = {
  health: GovernanceSystemHealth;
};

function HealthBadge({ label, value }: { label: string; value: "stable" | "degraded" }) {
  const { t } = useTranslation();
  return (
    <div
      className={`rounded-xl px-3 py-2 text-sm ${
        value === "stable" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
    >
      {label}: <span className="font-semibold">{t(`health.${value}`)}</span>
    </div>
  );
}

export function SystemHealthSection({ health }: SystemHealthSectionProps) {
  const { t } = useTranslation();
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{t("governance.dashboard.systemHealth.title")}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <HealthBadge label={t("governance.dashboard.systemHealth.realtime")} value={health.realtime} />
        <HealthBadge label={t("governance.dashboard.systemHealth.sync")} value={health.sync} />
        <HealthBadge label={t("governance.dashboard.systemHealth.middleware")} value={health.middleware} />
        <HealthBadge label={t("governance.dashboard.systemHealth.invitations")} value={health.invitation} />
      </div>
    </section>
  );
}
