import Link from "next/link";
import Image from "next/image";
import { Home, LogIn } from "lucide-react";
import { appConfig, getLogoUrl } from "@/lib/config";

export const metadata = {
  title: `Page introuvable — ${appConfig.name}`,
};

/**
 * Page 404 personnalisée.
 * Affichée pour toute URL inconnue de l'application.
 * Les boutons renvoient vers / (qui redirige selon l'état de connexion).
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-primary px-4">

      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <Image
          src={getLogoUrl()}
          alt={appConfig.name}
          width={64}
          height={64}
          className="rounded-2xl object-contain drop-shadow-lg"
          unoptimized
          priority
        />
        <span className="text-xl font-bold text-white">{appConfig.name}</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-white px-10 py-12 shadow-xl text-center">

        {/* Code 404 stylisé */}
        <p className="text-8xl font-extrabold tracking-tighter text-primary/10 select-none">
          404
        </p>

        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Page introuvable
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          L&apos;adresse que vous avez saisie n&apos;existe pas ou a été déplacée.
          <br />
          Vérifiez l&apos;URL ou utilisez les liens ci-dessous.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
          >
            <Home size={16} />
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <LogIn size={16} />
            Aller à la connexion
          </Link>
        </div>

        {/* Retour au domaine principal */}
        <p className="mt-5 text-xs text-gray-400">
          Vous cherchez{" "}
          <a
            href="https://rempres.com"
            className="underline hover:text-gray-600 transition"
          >
            rempres.com
          </a>{" "}
          ?
        </p>
      </div>

      <p className="mt-8 text-xs text-white/30">
        {appConfig.name} v{appConfig.version}
      </p>
    </main>
  );
}
