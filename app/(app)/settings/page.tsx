import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole } from "@/lib/server/permissions";
import { appConfig } from "@/lib/config";
import { loadLocaleMessages, translateFromDict } from "@/lib/i18n/load-messages";
import { normalizeLocale } from "@/lib/i18n/config";
import { updatePreferredLanguageAction } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { ModulePageStack } from "@/components/ui/module-page-stack";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", data.user.id)
    .is("deleted_at", null)
    .maybeSingle();
  const locale = normalizeLocale(profile?.preferred_language);
  const { messages } = await loadLocaleMessages(locale);
  const t = (key: string) => translateFromDict(messages, key);

  const isAdmin = await isAdminRole(data.user.id);

  return (
    <div className="page-wrapper">
      <ModulePageStack className="max-w-3xl">
        <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
          <Globe size={13} />
          {t("settings.language.section")}
        </h2>
        <form action={updatePreferredLanguageAction} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <select
              name="preferredLanguage"
              defaultValue={locale}
              aria-label={t("settings.language.selectLabel")}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="pt">Português</option>
            </select>
            <button type="submit" className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white">
              {t("common.apply")}
            </button>
          </div>
        </form>
      </section>

      {/* Informations de l'application */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
          <Info size={13} />
          {t("settings.generalInfo")}
        </h2>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="divide-y divide-gray-50">
            {[
              { icon: Building2, label: t("settings.info.app"), value: appConfig.name },
              { icon: Tag, label: t("settings.info.version"), value: appConfig.version },
              { icon: Info, label: t("settings.info.description"), value: appConfig.tagline },
              { icon: MapPin, label: t("settings.info.country"), value: appConfig.country },
              { icon: MapPin, label: t("settings.info.address"), value: appConfig.address },
              { icon: Mail, label: t("settings.info.contact"), value: appConfig.email },
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
            {t("settings.configuration")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <SettingsCard
              href="/admin/users"
              icon={Users}
              title={t("settings.users.title")}
              description={t("settings.users.description")}
              badge={t("navigation.module.admin")}
            />
            <SettingsCard
              href="/admin/currency"
              icon={Globe}
              title={t("settings.currency.title")}
              description={t("settings.currency.description")}
              badge={t("navigation.module.admin")}
            />
          </div>
        </section>
      )}

      {/* Note version */}
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-5 py-4">
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-darktext">RemPres ERP</span> — version {appConfig.version}. Les autres
          préférences et intégrations sont gérées depuis les modules concernés ou l&apos;administration.
        </p>
      </div>

      </ModulePageStack>
    </div>
  );
}
