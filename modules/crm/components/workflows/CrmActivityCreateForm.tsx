"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCrmActivityAction } from "@/modules/crm/server/actions/crm-actions";

type Props = {
  relatedKind: "lead" | "opportunity" | "client" | "quote" | "sale";
  relatedId: string;
};

export function CrmActivityCreateForm({ relatedKind, relatedId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!relatedId) return null;

  return (
    <form
      className="grid gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await createCrmActivityAction({
            activityType: String(fd.get("activityType")) as "call" | "meeting" | "task",
            subject: String(fd.get("subject") ?? ""),
            relatedKind,
            relatedId,
            dueAt: String(fd.get("dueAt") ?? "") || undefined,
            body: String(fd.get("body") ?? "") || undefined,
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
      <p className="sm:col-span-2 text-sm font-medium text-emerald-900">
        Nouvelle activité ({relatedKind})
      </p>
      <select
        name="activityType"
        defaultValue="call"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      >
        <option value="call">Appel</option>
        <option value="meeting">Réunion</option>
        <option value="task">Tâche</option>
        <option value="email">Email</option>
        <option value="note">Note</option>
      </select>
      <input
        name="subject"
        required
        placeholder="Sujet"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        name="dueAt"
        type="datetime-local"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        name="body"
        placeholder="Notes"
        className="sm:col-span-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="sm:col-span-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Créer l'activité"}
      </button>
      {error ? <p className="sm:col-span-2 text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
