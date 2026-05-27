"use client";

import { AutoRecoverRouteError } from "@/components/ui/auto-recover-route-error";

type VenteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function VenteError({ error, reset }: VenteErrorProps) {
  return (
    <AutoRecoverRouteError
      scope="vente"
      error={error}
      reset={reset}
      fallbackHref="/vente/historique"
      loadingMessage="Chargement du module vente…"
    />
  );
}
