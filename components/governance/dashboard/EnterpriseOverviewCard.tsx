import {
  EXEC_CARD,
  EXEC_CARD_PAD,
  EXEC_KPI_SUBTITLE,
  EXEC_KPI_TITLE,
  EXEC_KPI_VALUE,
} from "@/components/executive/tokens";

type EnterpriseOverviewCardProps = {
  title: string;
  value: string;
  subtitle: string;
};

export function EnterpriseOverviewCard({
  title,
  value,
  subtitle,
}: EnterpriseOverviewCardProps) {
  return (
    <article className={`${EXEC_CARD} ${EXEC_CARD_PAD}`}>
      <p className={EXEC_KPI_TITLE}>{title}</p>
      <p className={EXEC_KPI_VALUE}>{value}</p>
      <p className={EXEC_KPI_SUBTITLE}>{subtitle}</p>
    </article>
  );
}
