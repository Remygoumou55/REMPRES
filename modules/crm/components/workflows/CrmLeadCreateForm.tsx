"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCrmLeadAction } from "@/modules/crm/server/actions/crm-actions";

export function CrmLeadCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await createCrmLeadAction({
            companyName: String(fd.get("companyName") ?? ""),
            contactFirstName: String(fd.get("contactFirstName") ?? ""),
            contactLastName: String(fd.get("contactLastName") ?? ""),
            email: String(fd.get("email") ?? ""),
            phone: String(fd.get("phone") ?? ""),
            source: String(fd.get("source") ?? ""),
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
      <p className="sm:col-span-2 text-sm font-medium text-indigo-900">Nouveau lead</p>
      <input
        name="companyName"
        placeholder="Société"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        name="contactFirstName"
        placeholder="Prénom"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        name="contactLastName"
        placeholder="Nom"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        name="phone"
        placeholder="Téléphone"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        name="source"
        placeholder="Source"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm sm:col-span-2"
      />
      {error ? (
        <p className="sm:col-span-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "Création…" : "Créer le lead"}
        </button>
      </div>
    </form>
  );
}
