type GovernanceMetricsCardProps = {
  label: string;
  value: string;
};

export function GovernanceMetricsCard({ label, value }: GovernanceMetricsCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
