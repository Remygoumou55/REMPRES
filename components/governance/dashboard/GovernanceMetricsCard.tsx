import { EXEC_KPI_TITLE } from "@/components/executive/tokens";

type GovernanceMetricsCardProps = {
  label: string;
  value: string;
};

export function GovernanceMetricsCard({ label, value }: GovernanceMetricsCardProps) {
  return (
    <div className="min-h-[88px] rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className={`${EXEC_KPI_TITLE} normal-case tracking-normal`}>{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900 tabular-nums">{value}</p>
    </div>
  );
}
