"use client";

import { useTranslation } from "@/hooks/use-translation";

export function ComplianceHealthCard({
  criticalEvents7d,
  securityEvents7d,
  unresolvedAlerts,
}: {
  criticalEvents7d: number;
  securityEvents7d: number;
  unresolvedAlerts: number;
}) {
  const { t } = useTranslation();
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{t("governance.audit.complianceHealth.title")}</h2>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-xl bg-red-50 px-3 py-2 text-red-700">
          {t("governance.audit.complianceHealth.critical7d")}: <span className="font-semibold">{criticalEvents7d}</span>
        </div>
        <div className="rounded-xl bg-violet-50 px-3 py-2 text-violet-700">
          {t("governance.audit.complianceHealth.security7d")}: <span className="font-semibold">{securityEvents7d}</span>
        </div>
        <div className="rounded-xl bg-amber-50 px-3 py-2 text-amber-700">
          {t("governance.audit.complianceHealth.unresolvedAlerts")}: <span className="font-semibold">{unresolvedAlerts}</span>
        </div>
      </div>
    </section>
  );
}
