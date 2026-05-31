"use client";

import { useMemo } from "react";
import type { Product } from "@/types/product";
import { ExportButton } from "@/components/ui/ExportButton";
import type { ExcelColumn } from "@/lib/utils/export-excel";
import type { PdfColumn } from "@/lib/utils/export-pdf";
import { formatDateDayFr } from "@/lib/utils/formatDate";

const EXCEL_COLUMNS: ExcelColumn[] = [
  { key: "sku", label: "Référence", width: 14 },
  { key: "name", label: "Nom", width: 24 },
  { key: "unit", label: "Unité", width: 10 },
  { key: "price_gnf", label: "Prix (GNF)", width: 16 },
  { key: "stock_quantity", label: "Stock", width: 10 },
  { key: "created_at", label: "Date création", width: 16 },
];

const PDF_COLUMNS: PdfColumn[] = [
  { key: "sku", label: "Réf.", width: 70 },
  { key: "name", label: "Nom", width: 140 },
  { key: "unit", label: "Unité", width: 50 },
  { key: "price_gnf", label: "Prix (GNF)", width: 90 },
  { key: "stock_quantity", label: "Stock", width: 50 },
  { key: "created_at", label: "Créé le", width: 80 },
];

type Props = {
  products: Product[];
};

export function ProductsExportButton({ products }: Props) {
  const data = useMemo(
    () =>
      products.map((p) => ({
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        price_gnf: p.price_gnf,
        stock_quantity: p.stock_quantity,
        created_at: formatDateDayFr(p.created_at),
      })),
    [products],
  );

  return (
    <ExportButton
      data={data}
      filename="rempres-produits"
      title="Rapport Produits"
      subtitle="RemPres ERP"
      excelColumns={EXCEL_COLUMNS}
      pdfColumns={PDF_COLUMNS}
    />
  );
}
