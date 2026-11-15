import type { Metadata } from "next";
import { AlertOctagon, Check } from "lucide-react";
import { CtaBand } from "@/components/CtaBand";
import { PageHeader, SectionHeading } from "@/components/ui";
import { checks, scamSignals, verifiedPoints } from "@/data/content";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Vérifiez-nous : 6 vérifications avant de payer",
  description: "Comment vérifier KBA et le vendeur coréen avant d'envoyer de l'argent : numéro d'entreprise, numéro de châssis, vidéo à votre nom, B/L, compte d'entreprise.",
};

export default function VerifiezNous() {
  return (
    <>
      <PageHeader
        eyebrow="KBA-04 / Vérifiez-nous"
        title={<>Ne nous croyez pas.<br /><span className="text-blue-600">Vérifiez.</span></>}
        intro="Les fausses pages qui encaissent un acompte puis disparaissent existent. Voici comment vérifier, vous-même et en quelques minutes, que vous avez affaire à une vraie entreprise."
      >
        <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-4">
          {[
            ["Entreprise", site.name],
            ["RCCM (Guinée)", site.legal.rccm],
            ["Bureau", `${site.address.city}, ${site.address.country}`],
            ["Équipe en Corée", `${site.korea.city}`],
          ].map(([k, v]) => (
            <div key={k} className="bg-white p-4">
              <dt className="font-mono text-[10px] uppercase tracking-label text-muted">{k}</dt>
              <dd className="mt-1.5 text-[14px] font-semibold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </PageHeader>

      <section className="py-16 md:py-24">
        <div className="container">
          <SectionHeading eyebrow="Les 6 vérifications" title={<>À faire avant de payer.</>} intro="Si une seule de ces vérifications échoue, n'envoyez pas d'argent, à nous comme à n'importe qui." />
          <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
            {checks.map((c, i) => (
              <li key={c.title} className="bg-white p-7">
                <span className="font-mono text-[11px] text-blue-600">Vérification 0{i + 1}</span>
                <h3 className="mt-3 text-[17px] font-semibold text-ink">{c.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{c.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-line bg-paper py-16 md:py-24">
        <div className="container grid gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Ce que nous contrôlons</p>
            <h2 className="h-section mt-3">Avant de vous proposer une voiture.</h2>
            <ul className="mt-8 space-y-3">
              {verifiedPoints.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[15px] text-ink">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-ok" /> {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-warn/30 bg-white p-8">
            <p className="font-mono text-[11px] uppercase tracking-label text-warn">Signaux d'arnaque</p>
            <h2 className="mt-3 font-display text-2xl font-extrabold uppercase tracking-tight text-ink">Arrêtez tout si vous voyez ça.</h2>
            <ul className="mt-6 space-y-3">
              {scamSignals.map((s) => (
                <li key={s} className="flex items-start gap-3 text-[15px] text-ink">
                  <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0 text-warn" /> {s}
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-line pt-5 text-[14px] text-muted">
              Une page utilise notre nom avec un autre numéro ? Signalez-la-nous. Notre seul numéro WhatsApp est le <strong className="text-ink">{site.phoneDisplay}</strong>, et nous ne changeons jamais de numéro de compte par message.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <SectionHeading eyebrow="Nos preuves de livraison" title={<>Les vrais documents, publiés après chaque vente.</>} intro="Pour chaque voiture livrée, et avec l'accord du client, nous publions ici les documents réels (informations personnelles masquées) : photos d'inspection, déclaration d'export, certificat de radiation, B/L et chargement." />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["Inspection avant embarquement", "Déclaration d'export coréenne", "Certificat de radiation", "Chargement du conteneur"].map((t, i) => (
              <div key={t} className="flex aspect-[4/5] flex-col justify-between rounded-lg border border-dashed border-silver-300 bg-paper p-5">
                <span className="font-mono text-[10px] uppercase tracking-label text-muted">Document 0{i + 1}</span>
                <div>
                  <p className="text-[15px] font-semibold text-ink">{t}</p>
                  <p className="mt-1 text-[12.5px] text-muted">Publié après notre première livraison.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand title="Des questions avant de vous lancer ?" text="Appelez-nous en vidéo, ou passez nous voir à Conakry. Une vraie entreprise montre son visage." />
    </>
  );
}
