"use client";

import { useMemo } from "react";
import type { Client } from "@/types/client";
import { ExportButton } from "@/components/ui/ExportButton";
import type { ExcelColumn } from "@/lib/utils/export-excel";
import type { PdfColumn } from "@/lib/utils/export-pdf";
import { formatDateDayFr } from "@/lib/utils/formatDate";

const EXCEL_COLUMNS: ExcelColumn[] = [
  { key: "name", label: "Nom", width: 24 },
  { key: "email", label: "Email", width: 26 },
  { key: "phone", label: "Téléphone", width: 16 },
  { key: "company_name", label: "Entreprise", width: 22 },
  { key: "created_at", label: "Date création", width: 16 },
];

const PDF_COLUMNS: PdfColumn[] = [
  { key: "name", label: "Nom", width: 140 },
  { key: "email", label: "Email", width: 160 },
  { key: "phone", label: "Tél.", width: 90 },
  { key: "company_name", label: "Entreprise", width: 130 },
  { key: "created_at", label: "Créé le", width: 90 },
];

function clientDisplayName(c: Client): string {
  if (c.client_type === "company" && c.company_name?.trim()) {
    return c.company_name.trim();
  }
  return [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || "—";
}

type Props = {
  clients: Client[];
};

export function ClientsExportButton({ clients }: Props) {
  const data = useMemo(
    () =>
      clients.map((c) => ({
        name: clientDisplayName(c),
        email: c.email ?? "—",
        phone: c.phone ?? "—",
        company_name: c.company_name ?? "—",
        created_at: formatDateDayFr(c.created_at),
      })),
    [clients],
  );

  return (
    <ExportButton
      data={data}
      filename="rempres-clients"
      title="Rapport Clients"
      subtitle="RemPres ERP"
      excelColumns={EXCEL_COLUMNS}
      pdfColumns={PDF_COLUMNS}
    />
  );
}
