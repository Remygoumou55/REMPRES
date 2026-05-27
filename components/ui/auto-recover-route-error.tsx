"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { logError } from "@/lib/logger";
import { reportRouteError } from "@/lib/monitoring/error-monitor";

type AutoRecoverRouteErrorProps = {
  scope: string;
  error: Error & { digest?: string };
  reset: () => void;
  fallbackHref?: string;
  loadingMessage?: string;
};

/**
 * Boundary de route : journalise l'erreur, tente un reset() automatique,
 * puis redirige vers un écran stable — sans afficher l'écran rouge bloquant.
 */
export function AutoRecoverRouteError({
  scope,
  error,
  reset,
  fallbackHref = "/dashboard",
  loadingMessage = "Chargement…",
}: AutoRecoverRouteErrorProps) {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    logError("ui", `${scope} error boundary triggered`, {
      error: error.message,
      digest: error.digest,
    });
    reportRouteError(scope, error, { digest: error.digest ?? null });

    if (handled.current) return;
    handled.current = true;

    try {
      reset();
    } catch {
      router.replace(fallbackHref);
    }
  }, [scope, error, reset, router, fallbackHref]);

  return (
    <div className="page-wrapper flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-gray-500">{loadingMessage}</p>
    </div>
  );
}
