export function ApprovalAnalyticsCard({
  pendingApprovals,
  criticalEvents7d,
}: {
  pendingApprovals: number;
  criticalEvents7d: number;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Approval analytics</h2>
      <p className="mt-2 text-sm text-gray-600">
        Pending approvals: <strong>{pendingApprovals}</strong> · Critical governance events 7j:{" "}
        <strong>{criticalEvents7d}</strong>
      </p>
    </section>
  );
}
