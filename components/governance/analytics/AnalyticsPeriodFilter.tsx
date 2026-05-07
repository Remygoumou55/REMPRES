export function AnalyticsPeriodFilter({
  selected,
}: {
  selected: "7d" | "30d" | "90d";
}) {
  return (
    <select
      name="period"
      defaultValue={selected}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
    >
      <option value="7d">7 jours</option>
      <option value="30d">30 jours</option>
      <option value="90d">90 jours</option>
    </select>
  );
}
