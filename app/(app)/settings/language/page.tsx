import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole } from "@/lib/server/permissions";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Langue — Paramètres" };

export default async function SettingsLanguagePage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  if (!(await isAdminRole(data.user.id))) redirect("/access-denied");

  return (
    <div className="page-wrapper">
      <PageHeader title="Langue" subtitle="Gouvernance linguistique — verrouillée." />
      <section className="rounded-2xl border border-amber-200/80 bg-amber-50/95 p-6 shadow-sm">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
            <Lock size={22} aria-hidden />
          </div>
          <div className="space-y-2 text-sm text-amber-950">
            <p className="font-semibold">Français actif — autres langues verrouillées</p>
            <p className="text-xs leading-relaxed">
              La politique produit impose une interface française unique pour éviter la dette i18n et les duplications de
              libellés. Aucune activation multi-langue n&apos;est disponible depuis ce centre.
            </p>
            <ul className="list-inside list-disc text-xs text-amber-900/90">
              <li>English, 中文, Português — désactivés</li>
              <li>Pas de sélecteur actif sur les écrans Paramètres</li>
              <li>Réactivation future : décision gouvernance uniquement</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
