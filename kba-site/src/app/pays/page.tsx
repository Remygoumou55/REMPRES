import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CtaBand } from "@/components/CtaBand";
import { PageHeader } from "@/components/ui";
import { countries } from "@/data/countries";

export const metadata: Metadata = {
  title: "Pays livrés : Guinée, Sénégal, Mali, Côte d'Ivoire, Togo, Bénin",
  description: "Limite d'âge, port d'arrivée et délai pour chaque pays livré par Korea Business Auto.",
};

export default function PaysPage() {
  return (
    <>
      <PageHeader eyebrow="KBA-05 / Pays livrés" title={<>Les règles de<br /><span className="text-blue-600">votre pays.</span></>} intro="Chaque pays a sa limite d'âge et ses formalités. Nous les vérifions avant de vous proposer une voiture. Règles relevées en novembre 2026, confirmées par un transitaire avant chaque vente." />
      <section className="py-14 md:py-20">
        <div className="container overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-ink/80 font-mono text-[10px] uppercase tracking-label text-muted">
                <th className="py-3 pr-4 font-medium">Pays</th>
                <th className="py-3 pr-4 font-medium">Âge maximum</th>
                <th className="py-3 pr-4 font-medium">Arrivée</th>
                <th className="py-3 pr-4 font-medium">Délai indicatif</th>
                <th className="py-3" />
              </tr>
            </thead>
            <tbody>
              {countries.map((c) => (
                <tr key={c.slug} className="border-b border-line">
                  <td className="py-5 pr-4"><span className="mr-3 font-mono text-[11px] text-blue-600">{c.flag}</span><span className="font-semibold text-ink">{c.name}</span></td>
                  <td className="py-5 pr-4 text-ink">{c.maxAge}</td>
                  <td className="py-5 pr-4 text-muted">{c.port}</td>
                  <td className="py-5 pr-4 text-muted">{c.delay}</td>
                  <td className="py-5 text-right"><Link href={`/pays/${c.slug}`} className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline">Détails <ArrowRight className="h-3.5 w-3.5" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
