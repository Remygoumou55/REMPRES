"use client";

import { useMemo, useState } from "react";
import type { EmployeeDomainSnapshot } from "@/modules/hr/employees/types";
import { useEmployeeProfile } from "@/modules/hr/employees/hooks/use-employee-profile";
import { useEmployeeDocuments } from "@/modules/hr/employees/hooks/use-employee-documents";
import { useEmployeeHistory } from "@/modules/hr/employees/hooks/use-employee-history";
import { useOrgChart } from "@/modules/hr/employees/hooks/use-orgchart";
import { useEmployeeAnalytics } from "@/modules/hr/employees/hooks/use-employee-analytics";
import { DataTable } from "@/modules/hr/employees/ui/tables/DataTable";
import { SectionPanel } from "@/modules/hr/employees/ui/panels/SectionPanel";
import { EmployeeRoleForm } from "@/modules/hr/employees/components/forms/EmployeeRoleForm";
import { EmployeeManagerForm } from "@/modules/hr/employees/components/forms/EmployeeManagerForm";
import { EmployeeStatusForm } from "@/modules/hr/employees/components/forms/EmployeeStatusForm";
import { EmployeeDocumentsPanel } from "@/modules/hr/employees/components/documents/EmployeeDocumentsPanel";
import { EmployeeHistoryPanel } from "@/modules/hr/employees/components/history/EmployeeHistoryPanel";
import { EmployeeHierarchyPanel } from "@/modules/hr/employees/components/hierarchy/EmployeeHierarchyPanel";
import { EmployeeOrgChartPanel } from "@/modules/hr/employees/components/orgchart/EmployeeOrgChartPanel";
import { EmployeeAnalyticsPanel } from "@/modules/hr/employees/components/analytics/EmployeeAnalyticsPanel";
import { EmployeeTimelinePanel } from "@/modules/hr/employees/components/timeline/EmployeeTimelinePanel";
import { EmployeeStatusBadge } from "@/modules/hr/employees/components/EmployeeStatusBadge";
import { FormDialog } from "@/modules/hr/employees/ui/dialogs/FormDialog";

export function EmployeeAdminWorkspace({ snapshot }: { snapshot: EmployeeDomainSnapshot }) {
  const { query, setQuery, department, setDepartment, filteredProfiles, selectedEmployee, setSelectedEmployeeId } =
    useEmployeeProfile(snapshot);
  const { documents, setDocuments } = useEmployeeDocuments(selectedEmployee?.id ?? null);
  const { history } = useEmployeeHistory(selectedEmployee?.id ?? null);
  const { nodes } = useOrgChart(snapshot);
  const analytics = useEmployeeAnalytics(snapshot);
  const [editOpen, setEditOpen] = useState(false);

  const departmentOptions = useMemo(
    () => Array.from(new Set(snapshot.profiles.map((profile) => profile.departmentKey).filter(Boolean))) as string[],
    [snapshot.profiles],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Recherche collaborateur..."
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        />
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">Tous departements</option>
          {departmentOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!selectedEmployee}
          onClick={() => setEditOpen(true)}
          className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Editer employe
        </button>
      </section>

      <DataTable>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Nom</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Role</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Departement</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filteredProfiles.map((employee) => (
              <tr
                key={employee.id}
                onClick={() => setSelectedEmployeeId(employee.id)}
                className={`cursor-pointer border-b border-gray-100 ${
                  selectedEmployee?.id === employee.id ? "bg-primary/5" : ""
                }`}
              >
                <td className="px-3 py-2 text-darktext">{employee.fullName}</td>
                <td className="px-3 py-2 text-gray-700">{employee.roleKey}</td>
                <td className="px-3 py-2 text-gray-700">{employee.departmentKey ?? "—"}</td>
                <td className="px-3 py-2">
                  <EmployeeStatusBadge active={employee.isActive} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionPanel title="Analytics employes">
          <EmployeeAnalyticsPanel metrics={analytics} />
        </SectionPanel>
        <SectionPanel title="Organigramme">
          <EmployeeOrgChartPanel nodes={nodes} />
        </SectionPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionPanel title="Documents employe">
          {selectedEmployee ? (
            <EmployeeDocumentsPanel
              employeeId={selectedEmployee.id}
              documents={documents}
              onCreated={() => setDocuments([...documents])}
            />
          ) : (
            <p className="text-xs text-gray-500">Selectionnez un employe.</p>
          )}
        </SectionPanel>
        <SectionPanel title="Historique employe">
          <EmployeeHistoryPanel history={history} />
        </SectionPanel>
        <SectionPanel title="Timeline employe">
          <EmployeeTimelinePanel history={history} />
        </SectionPanel>
      </div>

      <SectionPanel title="Hierarchie">
        <EmployeeHierarchyPanel
          hierarchy={snapshot.hierarchy}
          selectedEmployeeId={selectedEmployee?.id ?? null}
        />
      </SectionPanel>

      <FormDialog
        title="Edition employe"
        open={editOpen}
        onClose={() => setEditOpen(false)}
      >
        {selectedEmployee ? (
          <div className="space-y-4">
            <EmployeeRoleForm
              employeeId={selectedEmployee.id}
              initialRoleKey={selectedEmployee.roleKey}
              initialDepartmentKey={selectedEmployee.departmentKey}
            />
            <EmployeeStatusForm employeeId={selectedEmployee.id} isActive={selectedEmployee.isActive} />
            <EmployeeManagerForm
              employeeId={selectedEmployee.id}
              profiles={snapshot.profiles}
              currentManagerId={
                snapshot.hierarchy.find((item) => item.employeeId === selectedEmployee.id)?.managerId ?? null
              }
              departmentKey={selectedEmployee.departmentKey}
            />
          </div>
        ) : (
          <p className="text-xs text-gray-500">Aucun employe selectionne.</p>
        )}
      </FormDialog>
    </div>
  );
}

