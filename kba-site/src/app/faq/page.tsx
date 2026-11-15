import type { Metadata } from "next";
import { CtaBand } from "@/components/CtaBand";
import { Faq } from "@/components/Faq";
import { PageHeader } from "@/components/ui";
import { faq } from "@/data/content";

export const metadata: Metadata = { title: "Questions fréquentes", description: "Paiement, confiance, état des voitures, transport, douane : les réponses à vos questions." };

export default function FaqPage() {
  const jsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.flatMap((g) => g.items).map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })) };
  return (
    <>
      <PageHeader eyebrow="KBA / Questions fréquentes" title={<>Vos questions.<br /><span className="text-blue-600">Nos réponses.</span></>} intro="Les questions que nos clients nous posent le plus souvent, avant de commander." />
      <section className="py-14 md:py-20">
        <div className="container space-y-14">
          {faq.map((g) => (
            <div key={g.group} className="grid gap-6 lg:grid-cols-[0.6fr_1.4fr]">
              <h2 className="font-display text-xl font-extrabold uppercase tracking-tight text-ink">{g.group}</h2>
              <Faq items={g.items} />
            </div>
          ))}
        </div>
      </section>
      <CtaBand title="Vous n'avez pas trouvé votre réponse ?" text="Posez-nous la question sur WhatsApp, un membre de l'équipe vous répond." />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
