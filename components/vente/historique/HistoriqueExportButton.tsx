"use client";

import { useMemo } from "react";
import type { Client } from "@/types/client";
import { ExportButton } from "@/components/ui/ExportButton";
import type { ExcelColumn } from "@/lib/utils/export-excel";
import type { PdfColumn } from "@/lib/utils/export-pdf";
import { formatDateDayFr } from "@/lib/utils/formatDate";
import type { SaleRow } from "@/components/vente/historique/sales-table";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  partial: "Partiel",
  paid: "Payé",
  overdue: "En retard",
  cancelled: "Annulé",
};

const EXCEL_COLUMNS: ExcelColumn[] = [
  { key: "reference", label: "Référence", width: 16 },
  { key: "client_name", label: "Client", width: 24 },
  { key: "total_gnf", label: "Total (GNF)", width: 18 },
  { key: "status", label: "Statut", width: 12 },
  { key: "created_at", label: "Date", width: 14 },
];

const PDF_COLUMNS: PdfColumn[] = [
  { key: "reference", label: "Référence", width: 90 },
  { key: "client_name", label: "Client", width: 160 },
  { key: "total_gnf", label: "Total (GNF)", width: 100 },
  { key: "status", label: "Statut", width: 80 },
  { key: "created_at", label: "Date", width: 80 },
];

function clientLabel(c: Client | undefined): string {
  if (!c) return "—";
  if (c.client_type === "company" && c.company_name?.trim()) {
    return c.company_name.trim();
  }
  return [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || "—";
}

type Props = {
  sales: SaleRow[];
  clientsById: Record<string, Client>;
};

export function HistoriqueExportButton({ sales, clientsById }: Props) {
  const data = useMemo(
    () =>
      sales.map((s) => ({
        reference: s.reference ?? s.id.slice(0, 8),
        client_name: clientLabel(s.client_id ? clientsById[s.client_id] : undefined),
        total_gnf: Number(s.total_amount_gnf ?? 0),
        status: STATUS_LABELS[s.payment_status] ?? s.payment_status,
        created_at: formatDateDayFr(s.created_at),
      })),
    [sales, clientsById],
  );

  return (
    <ExportButton
      data={data}
      filename="rempres-ventes"
      title="Rapport des Ventes"
      subtitle="RemPres ERP"
      excelColumns={EXCEL_COLUMNS}
      pdfColumns={PDF_COLUMNS}
    />
  );
}
