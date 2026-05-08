"use client";

import { useState, useTransition } from "react";
import { useAppMutationRefresh } from "@/hooks/use-app-mutation-refresh";
import { submitRhAttendanceAction } from "../actions";

export function RhAttendanceActions() {
  const [pending, startTransition] = useTransition();
  const { refreshAfterMutation } = useAppMutationRefresh();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = (eventType: "check_in" | "check_out") => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await submitRhAttendanceAction({ eventType });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage(eventType === "check_in" ? "Pointage entree enregistre." : "Pointage sortie enregistre.");
      refreshAfterMutation();
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => submit("check_in")}
          disabled={pending}
          className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          Pointer entree
        </button>
        <button
          type="button"
          onClick={() => submit("check_out")}
          disabled={pending}
          className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
        >
          Pointer sortie
        </button>
      </div>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

