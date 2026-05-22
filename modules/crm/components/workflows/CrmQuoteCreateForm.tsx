"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCrmQuoteAction } from "@/modules/crm/server/actions/crm-actions";

type ClientOption = { id: string; label: string };

type CrmQuoteCreateFormProps = {
  clients: ClientOption[];
};

export function CrmQuoteCreateForm({ clients }: CrmQuoteCreateFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3 rounded-xl border border-indigo-100 bg-white p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await createCrmQuoteAction({
            clientId: String(fd.get("clientId") ?? ""),
            notes: String(fd.get("notes") ?? ""),
            validUntil: String(fd.get("validUntil") ?? "") || undefined,
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
      <p className="sm:col-span-2 text-sm font-medium text-gray-900">Nouveau devis (brouillon)</p>
      <select
        name="clientId"
        required
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm sm:col-span-2"
        defaultValue=""
      >
        <option value="" disabled>
          Client…
        </option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <input
        name="validUntil"
        type="date"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        name="notes"
        placeholder="Notes"
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
          disabled={pending || clients.length === 0}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "Création…" : "Créer le devis"}
        </button>
      </div>
    </form>
  );
}
