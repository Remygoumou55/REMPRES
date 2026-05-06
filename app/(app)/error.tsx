"use client";

import { useEffect } from "react";
import { logError } from "@/lib/logger";
import { RouteErrorFallback } from "@/components/ui/route-error-fallback";

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

  return <RouteErrorFallback reset={reset} />;
}
