"use client";

import { useEffect } from "react";
import { logError } from "@/lib/logger";
import { RouteErrorFallback } from "@/components/ui/route-error-fallback";
import { reportRouteError } from "@/lib/monitoring/error-monitor";

type VenteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function VenteError({ error, reset }: VenteErrorProps) {
  useEffect(() => {
    logError("ui", "vente error boundary triggered", {
      error: error.message,
      digest: error.digest,
    });
    reportRouteError("vente", error, { digest: error.digest ?? null });
  }, [error]);

  return (
    <RouteErrorFallback
      title="Erreur module vente"
      message="Le module vente est temporairement indisponible. Reessayez ou revenez au tableau de bord."
      reset={reset}
      homeHref="/dashboard"
    />
  );
}
