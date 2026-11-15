import type { Metadata } from "next";
import { FindCarForm } from "@/components/FindCarForm";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Trouvez-la pour moi : recherche de voiture sur mesure en Corée",
  description: "Décrivez la voiture que vous cherchez, ou envoyez le lien d'une annonce coréenne : notre équipe à Incheon la trouve et vous répond sous 24 à 48 heures.",
};

export default function TrouvezPage() {
  return (
    <>
      <PageHeader
        eyebrow="KBA-06 / Sur mesure"
        title={<>Décrivez-la.<br /><span className="text-blue-600">On la trouve.</span></>}
        intro="Nos parcs partenaires en Corée ont des centaines de voitures qui ne sont pas encore sur le site. Remplissez ce formulaire : il s'ouvre dans WhatsApp, déjà rédigé. Réponse sous 24 à 48 heures."
      />
      <section className="py-14 md:py-20">
        <div className="container grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <FindCarForm />
          <aside className="space-y-6 text-[14px] text-muted">
            <div className="card p-6">
              <p className="eyebrow">Ce qui se passe ensuite</p>
              <ol className="mt-4 space-y-3">
                <li><strong className="text-ink">1.</strong> Nous cherchons dans nos parcs partenaires à Incheon.</li>
                <li><strong className="text-ink">2.</strong> Nous vous envoyons 1 à 3 propositions, chacune avec photos, dossier et prix total rendu port.</li>
                <li><strong className="text-ink">3.</strong> Vous choisissez, puis nous suivons les 10 étapes habituelles.</li>
              </ol>
            </div>
            <div className="card p-6">
              <p className="eyebrow">Vous avez vu une annonce en Corée ?</p>
              <p className="mt-3">Collez le lien de l'annonce (Encar, K Car…) dans le formulaire. Nous vérifions la voiture et le vendeur, et nous vous disons honnêtement si elle vaut le coup.</p>
            </div>
            <p className="text-[13px]">La recherche est gratuite et sans engagement.</p>
          </aside>
        </div>
      </section>
    </>
  );
}
