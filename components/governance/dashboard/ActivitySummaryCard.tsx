type ActivitySummaryCardProps = {
  activityEvents24h: number;
  activeUsers: number;
};

export function ActivitySummaryCard({
  activityEvents24h,
  activeUsers,
}: ActivitySummaryCardProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Resume activite entreprise</h2>
      <p className="mt-2 text-sm text-gray-600">
        {activityEvents24h} evenements traces sur 24h · {activeUsers} utilisateurs actifs.
      </p>
    </section>
  );
}
