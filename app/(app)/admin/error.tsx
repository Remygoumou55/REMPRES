"use client";

import { useEffect } from "react";
import { logError } from "@/lib/logger";
import { RouteErrorFallback } from "@/components/ui/route-error-fallback";
import { reportRouteError } from "@/lib/monitoring/error-monitor";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    logError("ui", "admin error boundary triggered", {
      error: error.message,
      digest: error.digest,
    });
    reportRouteError("admin", error, { digest: error.digest ?? null });
  }, [error]);

  return (
    <RouteErrorFallback
      title="Erreur administration"
      message="Les donnees d'administration sont indisponibles temporairement. Reessayez dans quelques instants."
      reset={reset}
      homeHref="/dashboard"
    />
  );
}
