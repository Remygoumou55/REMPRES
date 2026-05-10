export function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-darktext">{value}</p>
    </article>
  );
}

