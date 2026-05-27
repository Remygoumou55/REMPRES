"use client";

import { memo, useMemo } from "react";
import { ExportButton } from "@/components/ui/ExportButton";
import type { ExcelColumn } from "@/lib/utils/export-excel";
import type { PdfColumn } from "@/lib/utils/export-pdf";
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_LABELS,
  type CampaignStatus,
  type CampaignType,
} from "@/lib/types/marketing";

const EXCEL_COLUMNS: ExcelColumn[] = [
  { key: "name", label: "Campagne", width: 24 },
  { key: "status", label: "Statut", width: 12 },
  { key: "channel", label: "Canal", width: 12 },
  { key: "budget_gnf", label: "Budget (GNF)", width: 18 },
  { key: "sent_count", label: "Envoyés", width: 10 },
  { key: "open_count", label: "Ouverts", width: 10 },
  { key: "click_count", label: "Cliqués", width: 10 },
  { key: "conversion_count", label: "Convertis", width: 12 },
  { key: "start_date", label: "Début", width: 12 },
  { key: "end_date", label: "Fin", width: 12 },
];

const PDF_COLUMNS: PdfColumn[] = [
  { key: "name", label: "Campagne", width: 140 },
  { key: "status", label: "Statut", width: 70 },
  { key: "budget_gnf", label: "Budget", width: 90 },
  { key: "sent_count", label: "Envoyés", width: 55 },
  { key: "open_count", label: "Ouverts", width: 55 },
  { key: "conversion_count", label: "Convertis", width: 60 },
];

type Props = {
  data: Record<string, unknown>[];
};

function CampaignesExportWrapperInner({ data }: Props) {
  const rows = useMemo(
    () =>
      data.map((row) => ({
        ...row,
        status:
          CAMPAIGN_STATUS_LABELS[row.status as CampaignStatus] ??
          String(row.status ?? ""),
        channel:
          row.channel ??
          CAMPAIGN_TYPE_LABELS[row.type as CampaignType] ??
          "—",
      })),
    [data],
  );

  return (
    <ExportButton
      data={rows}
      filename="rempres-campagnes"
      title="Rapport Campagnes Marketing"
      subtitle="RemPres ERP"
      excelColumns={EXCEL_COLUMNS}
      pdfColumns={PDF_COLUMNS}
    />
  );
}

export const CampaignesExportWrapper = memo(CampaignesExportWrapperInner);
