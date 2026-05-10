"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/use-translation";
import {
  renewContractAction,
  submitContractForApprovalAction,
  transitionContractStatusAction,
} from "@/modules/hr/contracts/server/actions/contract-actions";

export function ContractWorkflowActions({
  contractId,
  currentStatus,
}: {
  contractId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newEndDate, setNewEndDate] = useState("");

  const refresh = () => router.refresh();

  const runTransition = (status: string) => {
    setError(null);
    startTransition(async () => {
      const result = await transitionContractStatusAction({ contractId, status });
      if (!result.success) {
        setError(result.error);
        return;
      }
      refresh();
    });
  };

  const runSubmitApproval = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitContractForApprovalAction({ contractId });
      if (!result.success) {
        setError(result.error);
        return;
      }
      refresh();
    });
  };

  const runRenew = () => {
    setError(null);
    if (!newEndDate.trim()) {
      setError(t("dashboard.rh.contracts.renew.dateRequired", "Indiquez une nouvelle date de fin."));
      return;
    }
    startTransition(async () => {
      const result = await renewContractAction({ contractId, newEndDate: newEndDate.trim() });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setNewEndDate("");
      refresh();
    });
  };

  if (currentStatus === "terminated") {
    return (
      <p className="text-xs text-gray-500">
        {t("dashboard.rh.contracts.workflow.terminated", "Contrat termine — workflow clos.")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {currentStatus === "draft" ? (
          <button
            type="button"
            disabled={pending}
            onClick={runSubmitApproval}
            className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-white"
          >
            {t("dashboard.rh.contracts.workflow.submitApproval", "Soumettre pour approbation")}
          </button>
        ) : null}

        {currentStatus === "pending_approval" ? (
          <span className="text-xs text-amber-700">
            {t(
              "dashboard.rh.contracts.workflow.awaitingGovernance",
              "En attente de validation super-admin (centre gouvernance).",
            )}
          </span>
        ) : null}

        {currentStatus === "active" ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => runTransition("renewal_due")}
              className="rounded-lg bg-amber-600 px-2 py-1 text-xs text-white"
            >
              {t("dashboard.rh.contracts.workflow.markRenewal", "Marquer renouvellement")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => runTransition("terminated")}
              className="rounded-lg bg-red-600 px-2 py-1 text-xs text-white"
            >
              {t("dashboard.rh.contracts.workflow.terminate", "Terminer")}
            </button>
          </>
        ) : null}

        {currentStatus === "renewal_due" || currentStatus === "expired" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => runTransition("terminated")}
            className="rounded-lg bg-red-600 px-2 py-1 text-xs text-white"
          >
            {t("dashboard.rh.contracts.workflow.terminate", "Terminer")}
          </button>
        ) : null}
      </div>

      {(currentStatus === "renewal_due" || currentStatus === "expired") && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 p-2">
          <label className="flex flex-col gap-1 text-[10px] text-gray-600">
            {t("dashboard.rh.contracts.renew.newEnd", "Nouvelle date de fin")}
            <input
              type="date"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
            />
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={runRenew}
            className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-white"
          >
            {t("dashboard.rh.contracts.renew.submit", "Enregistrer renouvellement")}
          </button>
        </div>
      )}

      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
