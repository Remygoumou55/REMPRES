"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CrmLeadStatus } from "@/lib/vente/runtime/crm-state-machine";
import { CRM_LEAD_STATUSES } from "@/lib/vente/runtime/crm-state-machine";
import {
  convertCrmLeadAction,
  updateCrmLeadStatusAction,
} from "@/modules/crm/server/actions/crm-actions";

type CrmLeadRowActionsProps = {
  leadId: string;
  currentStatus: CrmLeadStatus;
  hasCompany: boolean;
};

export function CrmLeadRowActions({ leadId, currentStatus, hasCompany }: CrmLeadRowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (currentStatus === "converted" || currentStatus === "lost") {
    return <span className="text-xs text-gray-400">Terminal</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        className="rounded border border-gray-200 px-2 py-1 text-xs"
        defaultValue=""
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as CrmLeadStatus;
          if (!next) return;
          setError(null);
          startTransition(async () => {
            const res = await updateCrmLeadStatusAction(leadId, next);
            if (!res.success) setError(res.error);
            else router.refresh();
            e.target.value = "";
          });
        }}
      >
        <option value="">Statut…</option>
        {CRM_LEAD_STATUSES.filter((s) => s !== currentStatus && s !== "converted").map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {currentStatus === "qualified" ? (
        <button
          type="button"
          disabled={pending}
          className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-800"
          onClick={() => {
            const phone = window.prompt("Téléphone client (obligatoire)");
            if (!phone?.trim()) return;
            setError(null);
            startTransition(async () => {
              const res = await convertCrmLeadAction(leadId, {
                clientType: hasCompany ? "company" : "individual",
                phone: phone.trim(),
              });
              if (!res.success) setError(res.error);
              else router.refresh();
            });
          }}
        >
          Convertir → client
        </button>
      ) : null}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
