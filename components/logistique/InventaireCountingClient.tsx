"use client";

import { memo, useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileDown } from "lucide-react";
import type { InventoryLine, InventorySession } from "@/lib/server/inventory";
import {
  completeSessionAction,
  fetchInventoryReportDataAction,
  updateLineAction,
} from "@/app/(app)/logistique/inventaire/actions";
import { downloadInventoryReport } from "@/components/logistique/InventoryReportPDF";
import { ConfirmDialog } from "@/components/ui/confirm-danger-dialog";
import { formatDateDayFr } from "@/lib/utils/formatDate";

const STATUS_BADGE: Record<
  InventorySession["status"],
  { label: string; className: string }
> = {
  draft: { label: "Brouillon", className: "bg-gray-100 text-gray-700" },
  in_progress: { label: "En cours", className: "bg-amber-100 text-amber-800" },
  completed: { label: "Terminé", className: "bg-blue-100 text-blue-800" },
  validated: { label: "Validé", className: "bg-emerald-100 text-emerald-800" },
};

function fmtQty(n: number): string {
  return Number(n).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function DiscrepancyCell({ discrepancy }: { discrepancy: number | null }) {
  if (discrepancy === null) {
    return <span className="text-gray-400">—</span>;
  }
  if (discrepancy === 0) {
    return <span className="font-semibold text-emerald-600">✓</span>;
  }
  if (discrepancy > 0) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        +{fmtQty(discrepancy)}
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
      {fmtQty(discrepancy)}
    </span>
  );
}

type CountRowProps = {
  line: InventoryLine;
  editable: boolean;
  onSave: (lineId: string, qty: number, notes: string) => void;
};

const CountRow = memo(function CountRow({ line, editable, onSave }: CountRowProps) {
  const [qty, setQty] = useState(
    line.counted_quantity === null ? "" : String(line.counted_quantity),
  );
  const [notes, setNotes] = useState(line.notes ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = useCallback(
    (nextQty: string, nextNotes: string) => {
      if (!editable) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const parsed = Number(nextQty);
        if (nextQty === "" || Number.isNaN(parsed) || parsed < 0) return;
        onSave(line.id, parsed, nextNotes);
      }, 500);
    },
    [editable, line.id, onSave],
  );

  const liveDiscrepancy =
    qty === "" || Number.isNaN(Number(qty))
      ? null
      : Number(qty) - line.theoretical_quantity;

  return (
    <tr className="border-b border-gray-50 align-top">
      <td className="px-4 py-3">
        <p className="font-medium text-darktext">{line.product_name}</p>
        {line.location ? (
          <p className="text-xs text-gray-400">{line.location}</p>
        ) : null}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-gray-600">
        {line.sku ?? "—"}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold tabular-nums text-blue-800">
          {fmtQty(line.theoretical_quantity)} {line.unit}
        </span>
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          min={0}
          step={0.01}
          value={qty}
          readOnly={!editable}
          onChange={(e) => {
            setQty(e.target.value);
            scheduleSave(e.target.value, notes);
          }}
          onBlur={() => {
            if (qty !== "" && !Number.isNaN(Number(qty))) {
              onSave(line.id, Number(qty), notes);
            }
          }}
          className="w-28 rounded-lg border border-gray-200 px-2 py-1.5 text-sm tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-gray-50"
        />
      </td>
      <td className="px-4 py-3">
        <DiscrepancyCell discrepancy={editable ? liveDiscrepancy : line.discrepancy} />
      </td>
      <td className="px-4 py-3">
        <textarea
          rows={1}
          value={notes}
          readOnly={!editable}
          onChange={(e) => {
            setNotes(e.target.value);
            scheduleSave(qty, e.target.value);
          }}
          onBlur={() => {
            if (qty !== "" && !Number.isNaN(Number(qty))) {
              onSave(line.id, Number(qty), notes);
            }
          }}
          placeholder="Notes…"
          className="w-full min-w-[120px] resize-none rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-gray-50"
        />
      </td>
    </tr>
  );
});

type Props = {
  session: InventorySession;
  lines: InventoryLine[];
  canWrite: boolean;
};

function InventaireCountingClientInner({ session, lines, canWrite }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [completeOpen, setCompleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editable = canWrite && session.status === "in_progress";
  const badge = STATUS_BADGE[session.status];

  const counted = useMemo(
    () => lines.filter((l) => l.counted_quantity !== null).length,
    [lines],
  );

  const progressPct = lines.length > 0 ? Math.round((counted / lines.length) * 100) : 0;

  const onSaveLine = useCallback(
    (lineId: string, countedQuantity: number, notes: string) => {
      startTransition(async () => {
        const result = await updateLineAction(lineId, countedQuantity, notes);
        if (!result.success) {
          setError(result.error ?? "Sauvegarde impossible.");
        }
      });
    },
    [],
  );

  const onComplete = () => {
    startTransition(async () => {
      setError(null);
      const result = await completeSessionAction(session.id);
      if (!result.success) {
        setError(result.error ?? "Impossible de terminer.");
        return;
      }
      setCompleteOpen(false);
      router.refresh();
    });
  };

  const onPdf = async () => {
    const { session: fresh, lines: reportLines } =
      await fetchInventoryReportDataAction(session.id);
    if (!fresh) return;
    await downloadInventoryReport(fresh, reportLines);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
        >
          {badge.label}
        </span>
        {session.started_at ? (
          <span className="text-xs text-gray-500">
            Démarré le {formatDateDayFr(session.started_at)}
          </span>
        ) : null}
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-gray-500">
          <span>Progression du comptage</span>
          <span>
            {counted}/{lines.length} produits comptés
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Stock système</th>
              <th className="px-4 py-3">Comptage physique</th>
              <th className="px-4 py-3">Écart</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <CountRow
                key={line.id}
                line={line}
                editable={editable}
                onSave={onSaveLine}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3">
        {editable ? (
          <button
            type="button"
            disabled={pending || counted < lines.length}
            onClick={() => setCompleteOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Marquer comme terminé
          </button>
        ) : null}
        {session.status === "validated" ? (
          <button
            type="button"
            onClick={() => void onPdf()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <FileDown className="h-4 w-4" />
            Rapport PDF
          </button>
        ) : null}
      </div>

      <ConfirmDialog
        open={completeOpen}
        tone="primary"
        title="Terminer l'inventaire"
        message="Tous les articles doivent être comptés. Vous pourrez ensuite valider les écarts depuis la liste des inventaires."
        confirmLabel="Marquer comme terminé"
        loading={pending}
        onCancel={() => setCompleteOpen(false)}
        onConfirm={onComplete}
      />
    </div>
  );
}

export const InventaireCountingClient = memo(InventaireCountingClientInner);
