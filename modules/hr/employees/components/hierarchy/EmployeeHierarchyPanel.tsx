import type { EmployeeHierarchyNode } from "@/modules/hr/employees/types";

export function EmployeeHierarchyPanel({
  hierarchy,
  selectedEmployeeId,
}: {
  hierarchy: EmployeeHierarchyNode[];
  selectedEmployeeId: string | null;
}) {
  if (!selectedEmployeeId) return <p className="text-xs text-gray-500">Aucun employe selectionne.</p>;
  const node = hierarchy.find((item) => item.employeeId === selectedEmployeeId);
  return (
    <div className="text-xs text-gray-700">
      <p>Manager: {node?.managerId ?? "Aucun"}</p>
      <p>Departement: {node?.departmentKey ?? "—"}</p>
      <p>Titre: {node?.title ?? "—"}</p>
    </div>
  );
}

