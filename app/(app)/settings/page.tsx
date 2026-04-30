import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import { appConfig } from "@/lib/config";
import {
  Settings2,
  Users,
  Globe,
  Info,
  ChevronRight,
  Building2,
  Mail,
  MapPin,
  Tag,
  ExternalLink,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Paramètres — RemPres",
};

// ---------------------------------------------------------------------------
// Carte d'accès rapide vers une section
// ---------------------------------------------------------------------------

function SettingsCard({
  href,
  icon: Icon,
  title,
  description,
  badge,
  external = false,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/15">
        <Icon size={20} className="text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-darktext">{title}</p>
          {badge && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-400">{description}</p>
      </div>
      {external ? (
        <ExternalLink size={14} className="shrink-0 text-gray-300 transition group-hover:text-primary/60" />
      ) : (
        <ChevronRight size={16} className="shrink-0 text-gray-300 transition group-hover:text-primary" />
      )}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page Paramètres
// ---------------------------------------------------------------------------

export default async function SettingsPage() {
  const supabase  = getSupabaseServerClient();
  const { data }  = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const isAdmin = await isSuperAdmin(data.user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Settings2 size={22} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-darktext">Paramètres</h1>
          <p className="mt-1 text-sm text-gray-400">
            Configuration globale de l&apos;application
          </p>
        </div>
      </div>

      {/* Informations de l'application */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
          <Info size={13} />
          Informations générales
        </h2>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="divide-y divide-gray-50">
            {[
              { icon: Building2, label: "Application",  value: appConfig.name },
              { icon: Tag,       label: "Version",       value: appConfig.version },
              { icon: Info,      label: "Description",   value: appConfig.tagline },
              { icon: MapPin,    label: "Pays",          value: appConfig.country },
              { icon: MapPin,    label: "Adresse",       value: appConfig.address },
              { icon: Mail,      label: "Contact",       value: appConfig.email },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-3.5">
                <Icon size={15} className="shrink-0 text-gray-400" />
                <span className="w-32 shrink-0 text-xs font-semibold text-gray-500">{label}</span>
                <span className="flex-1 truncate text-sm font-medium text-darktext">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sections admin */}
      {isAdmin && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
            <Settings2 size={13} />
            Configuration
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <SettingsCard
              href="/admin/users"
              icon={Users}
              title="Utilisateurs"
              description="Gérer les comptes et les invitations"
              badge="Admin"
            />
            <SettingsCard
              href="/admin/currency"
              icon={Globe}
              title="Taux de change"
              description="Consulter et forcer le rafraîchissement des taux"
              badge="Admin"
            />
          </div>
        </section>
      )}

      {/* Note version */}
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-5 py-4">
        <p className="text-xs text-gray-400">
          <span className="font-semibold text-gray-500">RemPres ERP</span> — version{" "}
          <span className="font-mono font-semibold text-primary">{appConfig.version}</span>.{" "}
          D&apos;autres paramètres (préférences, rôles, intégrations) seront disponibles dans les prochaines mises à jour.
        </p>
      </div>

    </div>
  );
}
