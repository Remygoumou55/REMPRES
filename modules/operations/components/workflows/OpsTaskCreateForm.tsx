"use client";

import { useState, useTransition } from "react";
import { createOpsTaskAction } from "@/modules/operations/server/actions/ops-actions";

export function OpsTaskCreateForm({ ownerUserId }: { ownerUserId: string }) {
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
          const res = await createOpsTaskAction({
            title,
            ownerUserId,
            assigneeUserId: ownerUserId,
            priority: (fd.get("priority") as "normal") || "normal",
          });
          setMessage(res.success ? "Tâche créée." : res.error);
          if (res.success) e.currentTarget.reset();
        });
      }}
    >
      <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">Titre</span>
        <input name="title" required className="rounded-lg border border-gray-300 px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">Priorité</span>
        <select name="priority" className="rounded-lg border border-gray-300 px-3 py-2">
          <option value="low">Basse</option>
          <option value="normal">Normale</option>
          <option value="high">Haute</option>
          <option value="urgent">Urgente</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "…" : "Créer tâche"}
      </button>
      {message ? <p className="w-full text-sm text-gray-600">{message}</p> : null}
    </form>
  );
}
