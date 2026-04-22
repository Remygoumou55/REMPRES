import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="min-h-screen bg-graylight p-6">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-darktext">Accès refusé</h1>
        <p className="mt-2 text-sm text-darktext/80">
          Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Retour au dashboard
        </Link>
      </div>
    </main>
  );
}
