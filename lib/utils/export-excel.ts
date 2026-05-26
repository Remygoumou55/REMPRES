"use client";

export type ExcelColumn = {
  key: string;
  label: string;
  width?: number;
};

export async function exportToExcel(
  data: Record<string, unknown>[],
  columns: ExcelColumn[],
  filename: string,
): Promise<void> {
  const XLSX = await import("xlsx");

  const rows = data.map((row) =>
    columns.reduce(
      (acc, col) => {
        acc[col.label] = row[col.key] ?? "";
        return acc;
      },
      {} as Record<string, unknown>,
    ),
  );

  const ws = XLSX.utils.json_to_sheet(rows);

  ws["!cols"] = columns.map((col) => ({
    wch: col.width ?? 20,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Données");

  const meta = XLSX.utils.aoa_to_sheet([
    ["RemPres ERP"],
    ["Export généré le", new Date().toLocaleDateString("fr-FR")],
    ["Fichier", filename],
  ]);
  XLSX.utils.book_append_sheet(wb, meta, "Infos");

  XLSX.writeFile(wb, `${filename}.xlsx`);
}
