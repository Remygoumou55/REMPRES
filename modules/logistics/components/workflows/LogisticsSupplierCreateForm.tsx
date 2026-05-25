"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLogisticsSupplierAction } from "@/modules/logistics/server/actions/logistics-actions";

export function LogisticsSupplierCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3 rounded-xl border border-amber-100 bg-amber-50/40 p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await createLogisticsSupplierAction({
            companyName: String(fd.get("companyName") ?? ""),
            contactEmail: String(fd.get("contactEmail") ?? "") || undefined,
            phone: String(fd.get("phone") ?? "") || undefined,
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
      <p className="sm:col-span-2 text-sm font-medium text-amber-900">Nouveau fournisseur</p>
      <input
        name="companyName"
        required
        placeholder="Raison sociale"
        className="sm:col-span-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        name="contactEmail"
        type="email"
        placeholder="Email"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        name="phone"
        placeholder="Téléphone"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="sm:col-span-2 rounded-lg bg-amber-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Créer le fournisseur"}
      </button>
      {error ? <p className="sm:col-span-2 text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
