"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCrmOpportunityAction } from "@/modules/crm/server/actions/crm-actions";

type StageOption = { id: string; label: string };

type CrmOpportunityCreateFormProps = {
  stages: StageOption[];
};

export function CrmOpportunityCreateForm({ stages }: CrmOpportunityCreateFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const defaultStage = stages.find((s) => s.label.toLowerCase().includes("prospec"))?.id ?? stages[0]?.id;

  return (
    <form
      className="grid gap-3 rounded-xl border border-indigo-100 bg-white p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await createCrmOpportunityAction({
            title: String(fd.get("title") ?? ""),
            stageId: String(fd.get("stageId") ?? ""),
            amountEstimatedGnf: Number(fd.get("amount") ?? 0),
          });
          if (!res.success) {
            setError(res.error);
            return;
          }
          e.currentTarget.reset();
          router.refresh();
        });
      }}
    >
      <p className="sm:col-span-2 text-sm font-medium text-gray-900">Nouvelle opportunité</p>
      <input
        name="title"
        required
        placeholder="Titre"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm sm:col-span-2"
      />
      <select
        name="stageId"
        required
        defaultValue={defaultStage}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      >
        {stages.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <input
        name="amount"
        type="number"
        min={0}
        step={1}
        placeholder="Montant GNF"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      {error ? (
        <p className="sm:col-span-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending || !stages.length}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "Création…" : "Créer"}
        </button>
      </div>
    </form>
  );
}
