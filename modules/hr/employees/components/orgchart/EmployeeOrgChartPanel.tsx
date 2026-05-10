import type { EmployeeOrgChartNode } from "@/modules/hr/employees/types";

export function EmployeeOrgChartPanel({ nodes }: { nodes: EmployeeOrgChartNode[] }) {
  if (!nodes.length) return <p className="text-xs text-gray-500">Organigramme indisponible.</p>;
  return (
    <ul className="grid gap-2 md:grid-cols-2">
      {nodes.slice(0, 40).map((node) => (
        <li key={node.id} className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700">
          {node.label} · {node.roleKey} · manager: {node.managerId?.slice(0, 8) ?? "root"}
        </li>
      ))}
    </ul>
  );
}

