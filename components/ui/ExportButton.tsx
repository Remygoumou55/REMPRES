"use client";

import { memo, useEffect, useRef, useState } from "react";
import { FileDown, FileText, FileSpreadsheet } from "lucide-react";
import type { ExcelColumn } from "@/lib/utils/export-excel";
import type { PdfColumn } from "@/lib/utils/export-pdf";

type Props = {
  data: Record<string, unknown>[];
  filename: string;
  title: string;
  subtitle?: string;
  excelColumns: ExcelColumn[];
  pdfColumns: PdfColumn[];
};

export const ExportButton = memo(function ExportButton({
  data,
  filename,
  title,
  subtitle,
  excelColumns,
  pdfColumns,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<"pdf" | "excel" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  async function handleExcel() {
    setLoading("excel");
    setOpen(false);
    try {
      const { exportToExcel } = await import("@/lib/utils/export-excel");
      await exportToExcel(data, excelColumns, filename);
    } catch (err) {
      console.error("Excel export error:", err);
    } finally {
      setLoading(null);
    }
  }

  async function handlePdf() {
    setLoading("pdf");
    setOpen(false);
    try {
      const { exportToPdf } = await import("@/lib/utils/export-pdf");
      await exportToPdf({
        title,
        subtitle,
        columns: pdfColumns,
        data,
        filename,
      });
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setLoading(null);
    }
  }

  const disabled = loading !== null || data.length === 0;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          padding: "6px 14px",
          borderRadius: "var(--border-radius-md, 8px)",
          border: "0.5px solid var(--color-border-secondary, #d1d5db)",
          background: "var(--color-background-primary, #fff)",
          color: "var(--color-text-primary, #111827)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <FileDown size={15} />
        {loading === "pdf"
          ? "Génération PDF..."
          : loading === "excel"
            ? "Génération Excel..."
            : "Exporter"}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: 38,
            right: 0,
            background: "var(--color-background-primary, #fff)",
            border: "0.5px solid var(--color-border-tertiary, #e5e7eb)",
            borderRadius: "var(--border-radius-md, 8px)",
            zIndex: 30,
            minWidth: 180,
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <button
            type="button"
            onClick={() => void handlePdf()}
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              gap: 8,
              padding: "9px 14px",
              fontSize: 13,
              color: "var(--color-text-primary, #111827)",
              cursor: "pointer",
              border: "none",
              borderBottom: "0.5px solid var(--color-border-tertiary, #e5e7eb)",
              background: "transparent",
              textAlign: "left",
            }}
          >
            <FileText size={14} style={{ color: "#E24B4A" }} />
            Télécharger PDF
          </button>
          <button
            type="button"
            onClick={() => void handleExcel()}
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              gap: 8,
              padding: "9px 14px",
              fontSize: 13,
              color: "var(--color-text-primary, #111827)",
              cursor: "pointer",
              border: "none",
              background: "transparent",
              textAlign: "left",
            }}
          >
            <FileSpreadsheet size={14} style={{ color: "#27500A" }} />
            Télécharger Excel
          </button>
        </div>
      )}
    </div>
  );
});
