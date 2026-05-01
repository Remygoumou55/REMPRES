"use client";

import { useEffect } from "react";
import { logError } from "@/lib/logger";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    logError("ui", "app error boundary triggered", {
      error: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-darktext">Erreur de chargement</h2>
      <p className="mt-2 text-sm text-gray-600">
        Impossible d&apos;afficher cette page pour le moment. Réessayez dans quelques secondes.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
      >
        Réessayer
      </button>
    </div>
  );
}
