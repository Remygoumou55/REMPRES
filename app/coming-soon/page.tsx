import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Calculator,
  GraduationCap,
  Briefcase,
  Megaphone,
  Truck,
  LayoutDashboard,
  Clock,
} from "lucide-react";
import { appConfig, getLogoUrl } from "@/lib/config";

// ---------------------------------------------------------------------------
// Métadonnées
// ---------------------------------------------------------------------------

export const metadata = {
  title: `En construction — ${appConfig.name}`,
};

// ---------------------------------------------------------------------------
// Mapping modules
// ---------------------------------------------------------------------------

const MODULE_INFO: Record<
  string,
  { label: string; description: string; Icon: React.ElementType; color: string }
> = {
  rh: {
    label: "Ressources Humaines",
    description:
      "Gestion des employés, des congés, des fiches de paie et de la performance.",
    Icon: Users,
    color: "bg-violet-100 text-violet-600",
  },
  finance: {
    label: "Finance & Comptabilité",
    description:
      "Suivi des dépenses, rapports financiers, comptabilité générale et analytique.",
    Icon: Calculator,
    color: "bg-emerald-100 text-emerald-600",
  },
  formation: {
    label: "Formation",
    description:
      "Gestion des formations internes et externes, suivi des certifications.",
    Icon: GraduationCap,
    color: "bg-amber-100 text-amber-600",
  },
  consultation: {
    label: "Consultation",
    description:
      "Gestion des missions de conseil, planification et suivi des consultants.",
    Icon: Briefcase,
    color: "bg-sky-100 text-sky-600",
  },
  marketing: {
    label: "Marketing",
    description:
      "Campagnes marketing, gestion des leads et analytics de croissance.",
    Icon: Megaphone,
    color: "bg-pink-100 text-pink-600",
  },
  logistique: {
    label: "Logistique",
    description:
      "Gestion des livraisons, des entrepôts et des flux de marchandises.",
    Icon: Truck,
    color: "bg-orange-100 text-orange-600",
  },
};

const DEFAULT_MODULE = {
  label: "Ce module",
  description: "Cette fonctionnalité est en cours de développement.",
  Icon: LayoutDashboard,
  color: "bg-gray-100 text-gray-500",
};

// ---------------------------------------------------------------------------
// Page (Server Component — lit searchParams directement)
// ---------------------------------------------------------------------------

export default function ComingSoonPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const moduleKey  = typeof searchParams.module === "string" ? searchParams.module : "";
  const moduleInfo = MODULE_INFO[moduleKey] ?? DEFAULT_MODULE;
  const { Icon }   = moduleInfo;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-primary px-4 py-16">

      {/* Logo + nom */}
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
      <div className="w-full max-w-lg rounded-2xl bg-white px-10 py-12 shadow-xl text-center">

        {/* Icône module */}
        <div className={`mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${moduleInfo.color}`}>
          <Icon size={32} />
        </div>

        {/* Badge "En construction" */}
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          <Clock size={11} />
          En cours de développement
        </div>

        <h1 className="mb-3 text-2xl font-extrabold text-gray-900">
          {moduleInfo.label}
        </h1>

        <p className="mb-8 text-sm leading-relaxed text-gray-500">
          {moduleInfo.description}
          <br /><br />
          Ce module sera disponible très prochainement.
          Contactez l&apos;administrateur pour plus d&apos;informations.
        </p>

        {/* Barre de progression décorative */}
        <div className="mb-8 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-primary to-[#2D7CC4] transition-all"
            style={{ width: "60%" }}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
          >
            <LayoutDashboard size={15} />
            Tableau de bord
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Changer de compte
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-white/30">
        {appConfig.name} v{appConfig.version}
      </p>
    </main>
  );
}
