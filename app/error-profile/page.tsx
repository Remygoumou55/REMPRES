import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { appConfig } from "@/lib/config";

export const metadata = {
  title: `Compte non configuré — ${appConfig.name}`,
};

export default function ErrorProfilePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-primary px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-xl text-center">

        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle size={32} className="text-amber-600" />
        </div>

        <h1 className="mb-3 text-xl font-bold text-gray-900">
          Compte non configuré
        </h1>

        <p className="mb-6 text-sm leading-relaxed text-gray-500">
          Votre compte n&apos;est pas correctement configuré.
          <br />
          Veuillez contacter l&apos;administrateur pour obtenir de l&apos;aide.
        </p>

        <div className="flex flex-col gap-2">
          <Link
            href="/login"
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Retour à la connexion
          </Link>
          <p className="text-xs text-gray-400">
            Code d&apos;erreur : PROFILE_NOT_FOUND
          </p>
        </div>
      </div>
    </main>
  );
}
