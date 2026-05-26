"use client";

import { useMemo } from "react";
import type { Employee } from "@/lib/types/rh";
import { ExportButton } from "@/components/ui/ExportButton";
import type { ExcelColumn } from "@/lib/utils/export-excel";
import type { PdfColumn } from "@/lib/utils/export-pdf";
import { formatDateDayFr } from "@/lib/utils/formatDate";

const CONTRACT_LABELS: Record<string, string> = {
  cdi: "CDI",
  cdd: "CDD",
  stage: "Stage",
  freelance: "Freelance",
};

const EXCEL_COLUMNS: ExcelColumn[] = [
  { key: "first_name", label: "Prénom", width: 16 },
  { key: "last_name", label: "Nom", width: 16 },
  { key: "email", label: "Email", width: 26 },
  { key: "position", label: "Poste", width: 20 },
  { key: "department", label: "Département", width: 18 },
  { key: "contract_type", label: "Contrat", width: 10 },
  { key: "hire_date", label: "Date embauche", width: 14 },
];

const PDF_COLUMNS: PdfColumn[] = [
  { key: "first_name", label: "Prénom", width: 70 },
  { key: "last_name", label: "Nom", width: 70 },
  { key: "position", label: "Poste", width: 120 },
  { key: "department", label: "Dép.", width: 90 },
  { key: "contract_type", label: "Contrat", width: 60 },
  { key: "hire_date", label: "Embauche", width: 80 },
];

type Props = {
  employees: Employee[];
};

export function CollaborateursExportButton({ employees }: Props) {
  const data = useMemo(
    () =>
      employees.map((e) => ({
        first_name: e.first_name,
        last_name: e.last_name,
        email: e.email ?? "—",
        position: e.position,
        department: e.department,
        contract_type: CONTRACT_LABELS[e.contract_type] ?? e.contract_type,
        hire_date: formatDateDayFr(e.hire_date),
      })),
    [employees],
  );

  return (
    <ExportButton
      data={data}
      filename="rempres-collaborateurs"
      title="Liste des Collaborateurs"
      subtitle="RemPres ERP"
      excelColumns={EXCEL_COLUMNS}
      pdfColumns={PDF_COLUMNS}
    />
  );
}
