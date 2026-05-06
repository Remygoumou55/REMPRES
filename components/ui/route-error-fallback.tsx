"use client";

type RouteErrorFallbackProps = {
  title?: string;
  message?: string;
  reset: () => void;
  homeHref?: string;
};

export function RouteErrorFallback({
  title = "Erreur de chargement",
  message = "Impossible d'afficher cette section pour le moment. Vous pouvez reessayer sans quitter l'application.",
  reset,
  homeHref = "/dashboard",
}: RouteErrorFallbackProps) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-darktext">{title}</h2>
      <p className="mt-2 text-sm text-gray-600">{message}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          Reessayer
        </button>
        <button
          type="button"
          onClick={() => window.location.assign(homeHref)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Retour a un ecran stable
        </button>
      </div>
    </div>
  );
}
