"use client";

import { useMemo } from "react";
import type { ExpenseListRow } from "@/lib/server/expenses";
import { ExportButton } from "@/components/ui/ExportButton";
import type { ExcelColumn } from "@/lib/utils/export-excel";
import type { PdfColumn } from "@/lib/utils/export-pdf";
import { formatDateDayFr } from "@/lib/utils/formatDate";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Espèces",
  mobile_money: "Mobile Money",
  bank_transfer: "Virement",
  other: "Autre",
};

const EXCEL_COLUMNS: ExcelColumn[] = [
  { key: "date", label: "Date", width: 14 },
  { key: "description", label: "Description", width: 30 },
  { key: "category", label: "Catégorie", width: 16 },
  { key: "amount_gnf", label: "Montant (GNF)", width: 18 },
  { key: "status", label: "Mode de paiement", width: 16 },
];

const PDF_COLUMNS: PdfColumn[] = [
  { key: "date", label: "Date", width: 70 },
  { key: "description", label: "Description", width: 200 },
  { key: "category", label: "Catégorie", width: 100 },
  { key: "amount_gnf", label: "Montant (GNF)", width: 100 },
  { key: "status", label: "Paiement", width: 80 },
];

type Props = {
  expenses: ExpenseListRow[];
};

export function DepensesExportButton({ expenses }: Props) {
  const data = useMemo(
    () =>
      expenses.map((r) => ({
        date: formatDateDayFr(r.expense_date),
        description: r.description,
        category: r.category_name,
        amount_gnf: r.amount_gnf,
        status: PAYMENT_LABELS[r.payment_method ?? ""] ?? r.payment_method ?? "—",
      })),
    [expenses],
  );

  return (
    <ExportButton
      data={data}
      filename="rempres-depenses"
      title="Rapport des Dépenses"
      subtitle="RemPres ERP"
      excelColumns={EXCEL_COLUMNS}
      pdfColumns={PDF_COLUMNS}
    />
  );
}
