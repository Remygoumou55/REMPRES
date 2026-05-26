"use client";

import { ExportButton } from "@/components/ui/ExportButton";
import type { ExcelColumn } from "@/lib/utils/export-excel";
import type { PdfColumn } from "@/lib/utils/export-pdf";

const EXCEL_COLUMNS: ExcelColumn[] = [
  { key: "date", label: "Date", width: 14 },
  { key: "source_type", label: "Type", width: 14 },
  { key: "description", label: "Description", width: 28 },
  { key: "amount_gnf", label: "Montant (GNF)", width: 18 },
  { key: "status", label: "Statut", width: 12 },
];

const PDF_COLUMNS: PdfColumn[] = [
  { key: "date", label: "Date", width: 70 },
  { key: "source_type", label: "Type", width: 80 },
  { key: "description", label: "Description", width: 220 },
  { key: "amount_gnf", label: "Montant (GNF)", width: 100 },
  { key: "status", label: "Statut", width: 80 },
];

type Props = {
  data: Record<string, unknown>[];
};

export function FinanceTransactionsExport({ data }: Props) {
  return (
    <ExportButton
      data={data}
      filename="rempres-transactions"
      title="Transactions financières"
      subtitle="RemPres ERP"
      excelColumns={EXCEL_COLUMNS}
      pdfColumns={PDF_COLUMNS}
    />
  );
}
