"use client";

import { AutoRecoverRouteError } from "@/components/ui/auto-recover-route-error";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: AdminErrorProps) {
  return (
    <AutoRecoverRouteError
      scope="admin"
      error={error}
      reset={reset}
      fallbackHref="/dashboard"
      loadingMessage="Chargement de l'administration…"
    />
  );
}
