"use client";

import { useState, useTransition } from "react";
import { useAppMutationRefresh } from "@/hooks/use-app-mutation-refresh";
import { updateRhLeaveStatusAction } from "../actions";

export function RhLeaveStatusActions({
  leaveRequestId,
  currentStatus,
  canManage,
}: {
  leaveRequestId: string;
  currentStatus: string;
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const { refreshAfterMutation } = useAppMutationRefresh();
  const [error, setError] = useState<string | null>(null);

  if (!canManage || currentStatus !== "pending") return null;

  const run = (status: "approved" | "rejected") => {
    setError(null);
    startTransition(async () => {
      const result = await updateRhLeaveStatusAction({ leaveRequestId, status });
      if (!result.success) {
        setError(result.error);
        return;
      }
      refreshAfterMutation();
    });
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => run("approved")}
        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        Approuver
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run("rejected")}
        className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      >
        Rejeter
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

