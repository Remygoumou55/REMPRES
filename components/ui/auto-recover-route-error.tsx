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
  const recovered = useRef(false);

  useEffect(() => {
    logError("ui", `${scope} error boundary triggered`, {
      error: error.message,
      digest: error.digest,
    });
    reportRouteError(scope, error, { digest: error.digest ?? null });

    const recoveryKey = `route-error:${scope}:${error.digest ?? error.message}`;
    const alreadyRetried =
      typeof sessionStorage !== "undefined" && sessionStorage.getItem(recoveryKey) === "1";

    if (alreadyRetried || recovered.current) {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem(recoveryKey);
      }
      router.replace(fallbackHref);
      return;
    }

    recovered.current = true;
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(recoveryKey, "1");
    }

    try {
      reset();
    } catch {
      router.replace(fallbackHref);
    }
  }, [scope, error, reset, router, fallbackHref]);

  return (
    <div className="page-wrapper flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm text-gray-500">{loadingMessage}</p>
      <a href={fallbackHref} className="text-sm font-medium text-primary hover:underline">
        Retour à un écran stable
      </a>
    </div>
  );
}
