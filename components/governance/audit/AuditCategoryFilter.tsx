import type { GovernanceAuditCategory } from "@/lib/governance/audit/types";

export function AuditCategoryFilter({
  selected,
}: {
  selected: GovernanceAuditCategory | "";
}) {
  const categories: GovernanceAuditCategory[] = [
    "authentication",
    "approval",
    "mutation",
    "archive",
    "invitation",
    "governance",
    "security",
    "system",
  ];
  return (
    <select
      name="category"
      defaultValue={selected}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
    >
      <option value="">Toutes categories</option>
      {categories.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>
  );
}
