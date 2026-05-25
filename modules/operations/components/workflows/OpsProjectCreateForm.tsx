"use client";

import { useState, useTransition } from "react";
import { createOpsProjectAction } from "@/modules/operations/server/actions/ops-actions";

export function OpsProjectCreateForm({ ownerUserId }: { ownerUserId: string }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const title = String(fd.get("title") ?? "").trim();
        if (!title) return;
        start(async () => {
          setMessage(null);
          const res = await createOpsProjectAction({
            title,
            ownerUserId,
            budgetReference: String(fd.get("budgetReference") ?? "") || undefined,
            description: String(fd.get("description") ?? "") || undefined,
          });
          setMessage(res.success ? "Projet créé." : res.error);
          if (res.success) e.currentTarget.reset();
        });
      }}
    >
      <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">Titre projet</span>
        <input name="title" required className="rounded-lg border border-gray-300 px-3 py-2" />
      </label>
      <label className="flex min-w-[140px] flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">Réf. budget</span>
        <input name="budgetReference" className="rounded-lg border border-gray-300 px-3 py-2" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "…" : "Créer projet"}
      </button>
      {message ? <p className="w-full text-sm text-gray-600">{message}</p> : null}
    </form>
  );
}
