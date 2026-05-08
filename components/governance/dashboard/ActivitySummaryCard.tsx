"use client";

import { useTranslation } from "@/hooks/use-translation";
import {
  EXEC_CARD,
  EXEC_CARD_MIN_H,
  EXEC_CARD_PAD,
  EXEC_SECTION_TITLE,
  EXEC_SUBTLE,
} from "@/components/executive/tokens";

type ActivitySummaryCardProps = {
  activityEvents24h: number;
  activeUsers: number;
};

export function ActivitySummaryCard({
  activityEvents24h,
  activeUsers,
}: ActivitySummaryCardProps) {
  const { t } = useTranslation();
  return (
    <section className={`${EXEC_CARD} ${EXEC_CARD_PAD} ${EXEC_CARD_MIN_H}`}>
      <h2 className={EXEC_SECTION_TITLE}>{t("governance.dashboard.activitySummary.title")}</h2>
      <p className={`mt-3 ${EXEC_SUBTLE}`}>
        {t("governance.dashboard.activitySummary.eventsPrefix")} {activityEvents24h} ·{" "}
        {activeUsers} {t("governance.dashboard.activitySummary.activeUsersSuffix")}
      </p>
    </section>
  );
}
