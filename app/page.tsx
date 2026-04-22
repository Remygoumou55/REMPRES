import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { appConfig, getLogoUrl } from "@/lib/config";
import {
  ArrowRight,
  BarChart3,
  ShoppingCart,
  Users,
  Package,
  Shield,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: `${appConfig.name} — ${appConfig.tagline}`,
  description:
    "RemPres est la plateforme de gestion d'entreprise tout-en-un pour les PME africaines : ventes, clients, stock, facturation et comptabilité.",
};

// ---------------------------------------------------------------------------
// Fonctionnalités
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: ShoppingCart,
    title: "Point de vente",
    desc: "Encaissez rapidement avec le POS intégré. Espèces, Mobile Money, virement.",
  },
  {
    icon: Users,
    title: "Gestion clients",
    desc: "Base clients centralisée, historique d'achats et suivi des impayés.",
  },
  {
    icon: Package,
    title: "Gestion des stocks",
    desc: "Inventaire en temps réel, alertes de rupture et mouvements automatiques.",
  },
  {
    icon: BarChart3,
    title: "Rapports financiers",
    desc: "Dashboard avec KPIs, chiffre d'affaires, dépenses et marges.",
  },
  {
    icon: Shield,
    title: "Sécurité & audit",
    desc: "Journal d'activité complet, export signé SHA-256 et contrôle d'accès par rôle.",
  },
  {
    icon: Zap,
    title: "Multi-devises",
    desc: "GNF, XOF, USD, EUR — affichage dans la devise de votre choix.",
  },
] as const;

import { getDestinationForRole } from "@/lib/roleRedirects";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function LandingPage() {
  // Utilisateurs déjà connectés → rediriger vers leur espace selon leur rôle
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role_key")
      .eq("id", data.user.id)
      .maybeSingle();

    redirect(getDestinationForRole(profile?.role_key));
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Image
              src={getLogoUrl()}
              alt={`${appConfig.name} logo`}
              width={36}
              height={36}
              className="rounded-lg object-contain"
              priority
              unoptimized
            />
            <span className="text-lg font-bold text-[#0E4A8A]">{appConfig.name}</span>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-[#0E4A8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2D7CC4]"
          >
            Se connecter
          </Link>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0E4A8A] to-[#2D7CC4] pb-32 pt-36 text-white">
        {/* Cercles décoratifs */}
        <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-white/5" />
        <div className="absolute -bottom-48 -left-24 h-[400px] w-[400px] rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-400" />
            v{appConfig.version} — Disponible maintenant
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight md:text-6xl">
            Gérez votre entreprise
            <br />
            <span className="text-cyan-300">simplement et efficacement</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg text-white/80">
            {appConfig.name} centralise vos ventes, clients, stocks et finances
            dans une plateforme moderne, sécurisée et conçue pour les PME africaines.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-[#0E4A8A] shadow-lg transition hover:bg-cyan-50"
            >
              Accéder à l&apos;application
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white/90 transition hover:border-white hover:text-white"
            >
              Découvrir les fonctionnalités
            </a>
          </div>
        </div>
      </section>

      {/* ── STATS RAPIDES ──────────────────────────────────────────────── */}
      <section className="mx-auto -mt-16 max-w-4xl px-6">
        <div className="grid grid-cols-3 gap-4 rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-100">
          {[
            { value: "100%",   label: "Sécurisé"          },
            { value: "6+",     label: "Modules intégrés"  },
            { value: "4",      label: "Devises supportées" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-extrabold text-[#0E4A8A] md:text-3xl">{value}</p>
              <p className="mt-1 text-xs font-medium text-gray-500 md:text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 md:text-4xl">
            Tout ce dont vous avez besoin
          </h2>
          <p className="mt-3 text-gray-500">
            Un ERP complet, pensé pour le marché guinéen et ouest-africain.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 inline-flex rounded-xl bg-[#0E4A8A]/10 p-3 text-[#0E4A8A] transition group-hover:bg-[#0E4A8A] group-hover:text-white">
                <Icon size={22} />
              </div>
              <h3 className="mb-2 text-base font-bold text-gray-900">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────────────── */}
      <section className="bg-[#0E4A8A] py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-extrabold text-white md:text-4xl">
            Prêt à démarrer ?
          </h2>
          <p className="mb-8 text-white/70">
            Rejoignez les entreprises qui font confiance à {appConfig.name}.
          </p>
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-10 py-4 text-base font-bold text-[#0E4A8A] shadow-lg transition hover:bg-cyan-50"
          >
            Accéder à l&apos;application
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-gray-400 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image
              src={getLogoUrl()}
              alt={appConfig.name}
              width={24}
              height={24}
              className="rounded object-contain"
              unoptimized
            />
            <span className="font-semibold text-gray-600">{appConfig.name}</span>
            <span>— v{appConfig.version}</span>
          </div>
          <span>{appConfig.address} &mdash; {appConfig.email}</span>
          <span>&copy; {new Date().getFullYear()} {appConfig.name}. Tous droits réservés.</span>
        </div>
      </footer>

    </main>
  );
}
