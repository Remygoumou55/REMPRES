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
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
    </article>
  );
}
