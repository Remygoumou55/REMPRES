"use client";

import { useState, useTransition } from "react";
import { generateOpsReportAction } from "@/modules/operations/server/actions/ops-actions";

export function OpsReportGenerateButton() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        onClick={() =>
          start(async () => {
            const res = await generateOpsReportAction();
            setMessage(res.success ? `Rapport ${res.data.reportId} publié.` : res.error);
          })
        }
      >
        {pending ? "…" : "Publier rapport (bus)"}
      </button>
      {message ? <span className="text-sm text-gray-600">{message}</span> : null}
    </div>
  );
}
