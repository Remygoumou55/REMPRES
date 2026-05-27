"use client";

import { AutoRecoverRouteError } from "@/components/ui/auto-recover-route-error";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-graylight p-6">
        <main>
          <AutoRecoverRouteError
            scope="global"
            error={error}
            reset={reset}
            fallbackHref="/dashboard"
            loadingMessage="Redirection vers un écran stable…"
          />
        </main>
      </body>
    </html>
  );
}
