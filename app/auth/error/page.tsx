import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowRight, KeyRound, LifeBuoy, LogIn } from "lucide-react";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `Problème d’invitation — ${appConfig.name}`,
};

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

function readMessage(searchParams: Props["searchParams"]): string {
  const raw = searchParams.message;
  const encoded = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  if (!encoded.trim()) {
    return "Une erreur est survenue avec votre invitation.";
  }
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

/** Liens OAuth / invites expirés ou invalides, erreurs serveur sur /auth/callback */
export default function AuthErrorPage({ searchParams }: Props) {
  const message = readMessage(searchParams);
  const supportMail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <span
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600"
            aria-hidden
          >
            <AlertCircle className="h-8 w-8" strokeWidth={1.75} />
          </span>

          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Problème avec votre invitation
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
            Le lien que vous avez utilisé n’a pas pu finaliser votre accès. Souvent,
            il a expiré ou a déjà été utilisé. Vous pouvez reprendre le parcours
            sans contacter un administrateur en utilisant les actions ci-dessous.
          </p>
        </div>

        <div
          className="mb-8 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
          role="alert"
          aria-live="polite"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Détail
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-800">{message}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <LogIn className="h-4 w-4 shrink-0" aria-hidden />
            Aller à la connexion
            <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          </Link>

          <Link
            href="/forgot-password"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          >
            <KeyRound className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
            Mot de passe oublié — réinitialiser par e-mail
          </Link>

          {supportMail ? (
            <a
              href={`mailto:${supportMail}?subject=${encodeURIComponent(
                `${appConfig.name} — problème d’invitation`,
              )}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <LifeBuoy className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
              Contacter le support
            </a>
          ) : (
            <a
              href={appConfig.marketingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <LifeBuoy className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
              Visiter le site {appConfig.name}
            </a>
          )}
        </div>

        <p className="mt-8 border-t border-slate-100 pt-6 text-center text-xs leading-relaxed text-slate-500">
          Si vous n’avez pas encore de compte, demandez une{" "}
          <span className="font-medium text-slate-600">nouvelle invitation</span> à la
          personne qui gère les accès dans votre organisation.
        </p>
      </div>

      <p className="mt-8 text-xs text-slate-400">{appConfig.name}</p>
    </main>
  );
}
