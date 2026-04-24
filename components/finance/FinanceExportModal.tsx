"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { CsvExportSections } from "@/lib/server/finance-overview";

type Props = {
  open: boolean;
  onClose: () => void;
  onExport: (format: "csv" | "pdf", csv: CsvExportSections, pdf: PdfSections) => Promise<void>;
  busy: boolean;
};

export type PdfSections = { summary: boolean; deltas: boolean; daily: boolean; categories: boolean };

const defaultSections = (): { csv: CsvExportSections; pdf: PdfSections } => ({
  csv: {
    includeSummary: true,
    includeDeltas: true,
    includeDaily: true,
    includeCategories: true,
  },
  pdf: { summary: true, deltas: true, daily: true, categories: true },
});

/**
 * Export personnalisé (sections) — POST /api/finance/export.
 */
export function FinanceExportModal({ open, onClose, onExport, busy }: Props) {
  const [{ csv, pdf }, setState] = useState(defaultSections);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fermer"
      />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-darktext">Export personnalisé</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Choisissez les blocs à inclure. Les montants restent en GNF (comptabilité de base).
        </p>
        <div className="mb-3 text-xs font-semibold uppercase text-gray-400">CSV / Excel</div>
        <div className="mb-4 space-y-2">
          {(
            [
              ["includeSummary", "KPI (CA, dépenses, marge, moyennes)"],
              ["includeDeltas", "Comparaison période précédente"],
              ["includeDaily", "Flux journaliers"],
              ["includeCategories", "Dépenses par catégorie"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={csv[k]}
                onChange={(e) => setState((s) => ({ ...s, csv: { ...s.csv, [k]: e.target.checked } }))}
              />
              {label}
            </label>
          ))}
        </div>
        <div className="mb-3 text-xs font-semibold uppercase text-gray-400">PDF</div>
        <div className="mb-6 space-y-2">
          {(
            [
              ["summary", "Indicateurs clés"],
              ["deltas", "Variations vs période précédente"],
              ["daily", "Tableau de trésorerie"],
              ["categories", "Dépenses par catégorie"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pdf[k]}
                onChange={(e) => setState((s) => ({ ...s, pdf: { ...s.pdf, [k]: e.target.checked } }))}
              />
              {label}
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onExport("csv", csv, pdf)}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Télécharger CSV
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onExport("pdf", csv, pdf)}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-darktext disabled:opacity-50"
          >
            Télécharger PDF
          </button>
        </div>
      </div>
    </div>
  );
}
