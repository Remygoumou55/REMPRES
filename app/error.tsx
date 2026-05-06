"use client";

import { useEffect } from "react";
import { logError } from "@/lib/logger";
import { RouteErrorFallback } from "@/components/ui/route-error-fallback";

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
        <main>
          <RouteErrorFallback
            title="Erreur inattendue"
            message="Une erreur critique est survenue. Vous pouvez reessayer ou revenir au tableau de bord."
            reset={reset}
            homeHref="/dashboard"
          />
        </main>
      </body>
    </html>
  );
}
