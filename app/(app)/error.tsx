"use client";

import { AutoRecoverRouteError } from "@/components/ui/auto-recover-route-error";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  return (
    <AutoRecoverRouteError
      scope="app"
      error={error}
      reset={reset}
      fallbackHref="/dashboard"
      loadingMessage="Chargement de l'application…"
    />
  );
}
