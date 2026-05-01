"use client";

import { useEffect } from "react";
import { logError } from "@/lib/logger";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    logError("ui", "global error boundary triggered", {
      error: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="fr">
      <body className="min-h-screen bg-graylight p-6">
        <main className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-bold text-darktext">Une erreur est survenue</h1>
          <p className="mt-2 text-sm text-gray-600">
            L&apos;application a rencontré une erreur inattendue. Vous pouvez réessayer
            sans perdre votre session.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Réessayer
            </button>
            <button
              type="button"
              onClick={() => window.location.assign("/dashboard")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Retour au tableau de bord
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
