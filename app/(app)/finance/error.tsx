"use client";

import { useEffect } from "react";
import { logError } from "@/lib/logger";
import { RouteErrorFallback } from "@/components/ui/route-error-fallback";
import { reportRouteError } from "@/lib/monitoring/error-monitor";

type FinanceErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function FinanceError({ error, reset }: FinanceErrorProps) {
  useEffect(() => {
    logError("ui", "finance error boundary triggered", {
      error: error.message,
      digest: error.digest,
    });
    reportRouteError("finance", error, { digest: error.digest ?? null });
  }, [error]);

  return (
    <RouteErrorFallback
      title="Erreur module finance"
      message="Le module finance ne peut pas charger les donnees pour le moment. Reessayez."
      reset={reset}
      homeHref="/dashboard"
    />
  );
}
