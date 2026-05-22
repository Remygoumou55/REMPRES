import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { appConfig } from "@/lib/config";
import { loadLocaleMessages, translateFromDict } from "@/lib/i18n/load-messages";
import { normalizeLocale } from "@/lib/i18n/config";
import { Building2, Info, Mail, MapPin, Tag } from "lucide-react";

export async function SettingsUserPreferences({ userId }: { userId: string }) {
  const supabase = getSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  const locale = normalizeLocale(profile?.preferred_language ?? "fr");
  const { messages } = await loadLocaleMessages(locale);
  const t = (key: string) => translateFromDict(messages, key);

  return (
    <>
      <section className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm text-amber-950">
        <p className="font-semibold">Langue — verrouillée</p>
        <p className="mt-1 text-xs leading-relaxed">
          Français actif pour l&apos;ensemble de l&apos;ERP. Le changement de langue n&apos;est pas disponible (gouvernance
          i18n).
        </p>
      </section>

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
    </>
  );
}
