export function IncidentAnalyticsCard({
  unresolvedAlerts,
  securityEvents7d,
}: {
  unresolvedAlerts: number;
  securityEvents7d: number;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Incident analytics</h2>
      <p className="mt-2 text-sm text-gray-600">
        Alertes ouvertes: <strong>{unresolvedAlerts}</strong> · Security events 7j:{" "}
        <strong>{securityEvents7d}</strong>
      </p>
    </section>
  );
}
