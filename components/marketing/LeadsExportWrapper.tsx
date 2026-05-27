"use client";

import { memo, useMemo } from "react";
import { ExportButton } from "@/components/ui/ExportButton";
import type { ExcelColumn } from "@/lib/utils/export-excel";
import type { PdfColumn } from "@/lib/utils/export-pdf";
import {
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  type LeadSource,
  type LeadStatus,
} from "@/lib/types/marketing";
import { formatDateDayFr } from "@/lib/utils/formatDate";

const EXCEL_COLUMNS: ExcelColumn[] = [
  { key: "name", label: "Nom", width: 22 },
  { key: "email", label: "Email", width: 26 },
  { key: "phone", label: "Téléphone", width: 16 },
  { key: "company", label: "Entreprise", width: 22 },
  { key: "source", label: "Source", width: 14 },
  { key: "status", label: "Statut", width: 12 },
  { key: "campaign_name", label: "Campagne", width: 22 },
  { key: "created_at", label: "Date", width: 14 },
];

const PDF_COLUMNS: PdfColumn[] = [
  { key: "name", label: "Nom", width: 120 },
  { key: "email", label: "Email", width: 130 },
  { key: "company", label: "Entreprise", width: 100 },
  { key: "status", label: "Statut", width: 70 },
  { key: "campaign_name", label: "Campagne", width: 100 },
];

type Props = {
  data: Record<string, unknown>[];
};

function LeadsExportWrapperInner({ data }: Props) {
  const rows = useMemo(
    () =>
      data.map((row) => ({
        ...row,
        status:
          LEAD_STATUS_LABELS[row.status as LeadStatus] ??
          String(row.status ?? ""),
        source:
          LEAD_SOURCE_LABELS[row.source as LeadSource] ??
          String(row.source ?? ""),
        created_at: row.created_at
          ? formatDateDayFr(String(row.created_at))
          : "—",
      })),
    [data],
  );

  return (
    <ExportButton
      data={rows}
      filename="rempres-leads-marketing"
      title="Leads Marketing"
      subtitle="RemPres ERP"
      excelColumns={EXCEL_COLUMNS}
      pdfColumns={PDF_COLUMNS}
    />
  );
}

export const LeadsExportWrapper = memo(LeadsExportWrapperInner);
