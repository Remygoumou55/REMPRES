"use client";

import { useTranslation } from "@/hooks/use-translation";
import { GovernanceMetricsCard } from "./GovernanceMetricsCard";
import { EXEC_CARD, EXEC_CARD_MIN_H, EXEC_CARD_PAD, EXEC_SECTION_TITLE } from "@/components/executive/tokens";

type GovernanceInsightsSectionProps = {
  activityEvents24h: number;
  activeUsers: number;
};

export function GovernanceInsightsSection({
  activityEvents24h,
  activeUsers,
}: GovernanceInsightsSectionProps) {
  const { t } = useTranslation();
  return (
    <section className={`${EXEC_CARD} ${EXEC_CARD_PAD} ${EXEC_CARD_MIN_H}`}>
      <h2 className={EXEC_SECTION_TITLE}>{t("governance.dashboard.insights.title")}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <GovernanceMetricsCard label={t("governance.dashboard.insights.sensitive24h")} value={String(activityEvents24h)} />
        <GovernanceMetricsCard label={t("governance.dashboard.insights.activeUsers")} value={String(activeUsers)} />
      </div>
    </section>
  );
}
