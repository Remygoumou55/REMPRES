import type { Metadata } from "next";
import { CtaBand } from "@/components/CtaBand";
import { PageHeader, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Qui sommes-nous",
  description: "Korea Business Auto : une équipe en Corée du Sud et à Conakry, au service d'un achat de voiture à distance honnête et vérifiable.",
};

const values = [
  ["Honnêteté", "On montre tout, même les défauts. Une voiture d'occasion sans défaut, ça n'existe pas."],
  ["Transparence", "Prix détaillé, vrais documents, jamais d'argent sur un compte personnel."],
  ["La preuve avant la promesse", "On ne vous demande pas de nous faire confiance : on vous donne de quoi vérifier."],
  ["Proximité", "De vrais visages, un numéro guinéen, des réponses en moins de 2 heures."],
  ["Sérieux", "Une entreprise organisée, avec des procédures écrites et des partenaires choisis."],
] as const;

export default function APropos() {
  return (
    <>
      <PageHeader eyebrow="KBA / Qui sommes-nous" title={<>Un pont entre<br /><span className="text-blue-600">la Corée et l'Afrique.</span></>} intro="Korea Business Auto est née d'un constat simple : les voitures coréennes sont excellentes, mais acheter à distance fait peur. Trop de fausses pages, trop de frais surprise. Nous avons construit une façon d'acheter où chaque étape se prouve." />
      <section className="py-16 md:py-24">
        <div className="container grid gap-6 md:grid-cols-2">
          {[
            { initials: "D", name: "Désiré", place: "Incheon, Corée du Sud", role: "Relation avec les parcs automobiles, vérification des voitures, vidéos, suivi de l'embarquement. Il vend et fait livrer des voitures à Conakry depuis plusieurs années." },
            { initials: "R", name: "Rémi", place: "Conakry, Guinée", role: "Accueil et accompagnement des clients, communication, suivi des commandes, présence au port et remise des clés." },
          ].map((p) => (
            <div key={p.name} className="card flex gap-6 p-7">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-navy-900 font-display text-3xl font-extrabold text-white">{p.initials}</div>
              <div>
                <p className="text-lg font-semibold text-ink">{p.name}</p>
                <p className="font-mono text-[11px] uppercase tracking-label text-blue-600">{p.place}</p>
                <p className="mt-3 text-[14px] leading-relaxed text-muted">{p.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="border-y border-line bg-paper py-16 md:py-24">
        <div className="container">
          <SectionHeading eyebrow="Nos valeurs" title={<>Ce qui ne changera jamais.</>} />
          <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-5">
            {values.map(([t, d], i) => (
              <li key={t} className="bg-white p-6">
                <span className="font-mono text-[11px] text-blue-600">0{i + 1}</span>
                <h3 className="mt-3 text-[15px] font-semibold text-ink">{t}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="py-16 md:py-24">
        <div className="container grid gap-10 md:grid-cols-2">
          <div>
            <p className="eyebrow">Notre modèle</p>
            <h2 className="h-section mt-3">Nous ne possédons pas les voitures. Nous les choisissons.</h2>
          </div>
          <div className="space-y-4 text-[15px] leading-relaxed text-muted">
            <p>Nos voitures se trouvent dans des parcs automobiles partenaires en Corée du Sud, principalement à Incheon, la ville d'où partent la plupart des voitures d'occasion coréennes exportées.</p>
            <p>Nous vérifions chaque parc (entreprise enregistrée, compte bancaire à son nom, adresse) et chaque voiture (numéro de châssis, historique, inspection), avant de vous la présenter.</p>
            <p>Vous payez la voiture directement au parc, l'entreprise qui la vend. Nous sommes rémunérés par une commission, déjà comprise dans le prix affiché.</p>
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
