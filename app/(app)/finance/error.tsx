"use client";

import { AutoRecoverRouteError } from "@/components/ui/auto-recover-route-error";

type FinanceErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function FinanceError({ error, reset }: FinanceErrorProps) {
  return (
    <AutoRecoverRouteError
      scope="finance"
      error={error}
      reset={reset}
      fallbackHref="/dashboard"
      loadingMessage="Chargement du module finance…"
    />
  );
}
