import type { Metadata } from "next";
import { FileCheck2 } from "lucide-react";
import { CtaBand } from "@/components/CtaBand";
import { Faq } from "@/components/Faq";
import { PageHeader, SectionHeading } from "@/components/ui";
import { documentsByMoment, faq, steps } from "@/data/content";

export const metadata: Metadata = {
  title: "Comment acheter une voiture en Corée avec KBA",
  description: "Les 10 étapes, du choix de la voiture à la remise des clés : à chaque paiement, une preuve. Paiement en 2 fois à l'entreprise qui vend.",
};

export default function CommentAcheter() {
  return (
    <>
      <PageHeader
        eyebrow="KBA-02 / Comment acheter"
        title={<>10 étapes.<br /><span className="text-blue-600">Une preuve à chacune.</span></>}
        intro="De votre premier message à la remise des clés, vous savez toujours où en est votre voiture, et vous ne payez jamais sans avoir reçu une preuve."
      />

      <section className="py-16 md:py-24">
        <div className="container">
          <ol className="relative border-l border-line md:ml-4">
            {steps.map((s) => (
              <li key={s.n} className="relative pb-10 pl-8 last:pb-0 md:pl-12">
                <span className="absolute -left-[13px] top-0 flex h-[26px] w-[26px] items-center justify-center rounded-full border border-line bg-white font-mono text-[10px] text-blue-600">{s.n}</span>
                <div className="grid gap-3 md:grid-cols-[1fr_280px] md:gap-10">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">{s.title}</h2>
                    <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted">{s.text}</p>
                  </div>
                  <p className="inline-flex h-fit items-center gap-2 rounded-md bg-ok/[0.07] px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-ok">
                    <FileCheck2 className="h-4 w-4 shrink-0" /> {s.proof}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-line bg-paper py-16 md:py-24">
        <div className="container">
          <SectionHeading eyebrow="Les documents" title={<>Ce que vous recevez, et quand.</>} intro="Avant de payer quoi que ce soit, vous avez déjà le dossier complet de la voiture. Tout est rangé dans un dossier à votre nom." />
          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {documentsByMoment.map((d) => (
              <div key={d.moment} className="card p-6">
                <p className="font-mono text-[11px] uppercase tracking-label text-blue-600">{d.moment}</p>
                <ul className="mt-4 space-y-2.5 text-[13.5px] text-ink">
                  {d.items.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rotate-45 bg-blue-600" /> {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading className="md:items-start" eyebrow="Prix et délais" title={<>Combien, et combien de temps ?</>} intro="En général 45 à 70 jours entre l'acompte et les clés pour Conakry. Le prix de la voiture est bloqué dès l'acompte." />
          <Faq items={[...faq[2].items, ...faq[3].items]} />
        </div>
      </section>
      <CtaBand />
    </>
  );
}
