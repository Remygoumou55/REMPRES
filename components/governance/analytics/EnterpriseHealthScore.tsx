export function EnterpriseHealthScore({ score }: { score: number }) {
  const color =
    score >= 75 ? "text-emerald-700 bg-emerald-50" : score >= 50 ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50";
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Enterprise health score</h2>
      <div className={`mt-3 inline-flex rounded-xl px-3 py-2 text-lg font-semibold ${color}`}>
        {score}/100
      </div>
    </section>
  );
}
