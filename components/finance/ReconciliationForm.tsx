"use client";

import { memo, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Download, Loader2, Lock } from "lucide-react";
import {
  getReconciliationForPDFAction,
  saveBankBalanceAction,
  validateReconciliationAction,
} from "@/app/(app)/finance/rapprochement/actions";
import { downloadReconciliationPDF } from "@/components/finance/ReconciliationPDF";
import {
  getDiscrepancyColor,
  type BankReconciliation,
} from "@/lib/finance/bank-reconciliation-types";
import { formatGNF } from "@/lib/utils/formatCurrency";

type Props = {
  reconciliation: BankReconciliation;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  in_progress: "En cours",
  validated: "Validé",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-800",
  validated: "bg-emerald-100 text-emerald-800",
};

function ReconciliationFormInner({ reconciliation: rec }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [bankInput, setBankInput] = useState(
    rec.bank_balance_gnf != null ? String(rec.bank_balance_gnf) : "",
  );
  const [notes, setNotes] = useState(rec.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirmValidate, setConfirmValidate] = useState(false);

  const isValidated = rec.status === "validated";
  const parsedBank = bankInput.trim() === "" ? null : Number(bankInput);
  const liveDisc = useMemo(() => {
    if (parsedBank == null || !Number.isFinite(parsedBank)) return null;
    return Math.round(parsedBank - rec.system_balance_gnf);
  }, [parsedBank, rec.system_balance_gnf]);

  const discColors = getDiscrepancyColor(liveDisc ?? rec.discrepancy_gnf);

  const handleSave = () => {
    if (parsedBank == null || !Number.isFinite(parsedBank) || parsedBank < 0) {
      setError("Saisissez un solde bancaire valide (≥ 0).");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await saveBankBalanceAction(rec.id, parsedBank, notes || undefined);
      if (!result.success) {
        setError(result.error ?? "Enregistrement impossible.");
        return;
      }
      router.refresh();
    });
  };

  const handleValidate = () => {
    if (!confirmValidate) {
      setConfirmValidate(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await validateReconciliationAction(rec.id);
      if (!result.success) {
        setError(result.error ?? "Validation impossible.");
        setConfirmValidate(false);
        return;
      }
      setConfirmValidate(false);
      router.refresh();
    });
  };

  const handlePdf = () => {
    setError(null);
    startTransition(async () => {
      const result = await getReconciliationForPDFAction(rec.id);
      if (!result.success || !result.data) {
        setError(result.error ?? "Export impossible.");
        return;
      }
      try {
        await downloadReconciliationPDF(
          result.data,
          result.userName ?? "Responsable Finance",
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur PDF.");
      }
    });
  };

  return (
    <section className="card p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-darktext">
          Période : {rec.period_label}
        </h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            STATUS_STYLES[rec.status] ?? STATUS_STYLES.draft
          }`}
        >
          {STATUS_LABELS[rec.status] ?? rec.status}
          {isValidated ? (
            <Lock className="ml-1 inline h-3 w-3" aria-hidden />
          ) : null}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5">
          <p className="text-sm font-semibold text-primary">Solde RemPres</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-primary">
            {formatGNF(rec.system_balance_gnf)}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Calculé automatiquement (cumul année → fin de période)
          </p>
        </div>

        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-5">
          <label className="text-sm font-semibold text-emerald-800">
            Solde bancaire (GNF)
          </label>
          {isValidated ? (
            <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-900">
              {rec.bank_balance_gnf != null
                ? formatGNF(rec.bank_balance_gnf)
                : "—"}
            </p>
          ) : (
            <input
              type="number"
              min={0}
              step={1}
              value={bankInput}
              onChange={(e) => setBankInput(e.target.value)}
              placeholder="Saisir le solde de votre relevé"
              className="input mt-2 w-full text-lg font-semibold tabular-nums"
              disabled={pending}
            />
          )}
          <p className="mt-2 text-xs text-gray-500">
            Solde figurant sur votre relevé bancaire
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center text-center">
        {liveDisc == null && rec.discrepancy_gnf == null ? (
          <p className="text-sm text-gray-500">
            Saisissez le solde bancaire pour calculer l&apos;écart
          </p>
        ) : (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Écart {liveDisc != null ? "(aperçu)" : ""}
            </p>
            <div
              className="mt-2 rounded-xl px-6 py-4"
              style={{
                backgroundColor: discColors.bg,
                color: discColors.text,
              }}
            >
              {(liveDisc ?? rec.discrepancy_gnf) === 0 ? (
                <span className="inline-flex items-center gap-2 text-base font-semibold">
                  <CheckCircle className="h-5 w-5" />
                  Aucun écart — Conforme
                </span>
              ) : (liveDisc ?? rec.discrepancy_gnf)! > 0 ? (
                <span className="text-base font-semibold">
                  +{formatGNF((liveDisc ?? rec.discrepancy_gnf)!)}
                  {" — Excédent"}
                </span>
              ) : (
                <span className="text-base font-semibold">
                  {formatGNF((liveDisc ?? rec.discrepancy_gnf)!)}
                  {" — Déficit"}
                </span>
              )}
            </div>
            {(liveDisc ?? rec.discrepancy_gnf)! > 0 ? (
              <p className="mt-2 max-w-md text-xs text-gray-500">
                L&apos;argent en banque est supérieur au système. Transactions non
                enregistrées ?
              </p>
            ) : (liveDisc ?? rec.discrepancy_gnf)! < 0 ? (
              <p className="mt-2 max-w-md text-xs text-gray-500">
                L&apos;argent en banque est inférieur au système. Vérifiez les
                transactions.
              </p>
            ) : null}
          </>
        )}
      </div>

      {!isValidated ? (
        <div className="mt-6">
          <label className="text-sm text-gray-600">
            Notes (optionnel)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input mt-1 w-full text-sm"
              disabled={pending}
            />
          </label>
        </div>
      ) : rec.notes ? (
        <p className="mt-6 text-sm text-gray-600">
          <span className="font-medium">Notes :</span> {rec.notes}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {!isValidated ? (
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="btn-primary inline-flex items-center gap-2"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enregistrer
          </button>
        ) : null}
        {(rec.bank_balance_gnf != null || (parsedBank != null && parsedBank >= 0)) ? (
          <button
            type="button"
            onClick={handlePdf}
            disabled={pending}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter PDF
          </button>
        ) : null}
        {!isValidated && rec.bank_balance_gnf != null ? (
          <button
            type="button"
            onClick={handleValidate}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            {confirmValidate ? "Confirmer la validation (irréversible)" : "Valider le rapprochement"}
          </button>
        ) : null}
        {confirmValidate && !pending ? (
          <button
            type="button"
            onClick={() => setConfirmValidate(false)}
            className="text-sm text-gray-500 underline"
          >
            Annuler
          </button>
        ) : null}
      </div>
    </section>
  );
}

export const ReconciliationForm = memo(ReconciliationFormInner);
