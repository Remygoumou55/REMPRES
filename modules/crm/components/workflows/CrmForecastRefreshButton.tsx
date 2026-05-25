"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshCrmForecastAction } from "@/modules/crm/server/actions/crm-actions";

export function CrmForecastRefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await refreshCrmForecastAction();
            if (!res.success) {
              setError(res.error);
              return;
            }
            router.refresh();
          })
        }
        className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Calcul…" : "Actualiser le snapshot prévision"}
      </button>
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </div>
  );
}
