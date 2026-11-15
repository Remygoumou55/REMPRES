import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { guides } from "@/data/guides";

export const metadata: Metadata = {
  title: "Guides : importer une voiture coréenne en Afrique de l'Ouest",
  description: "Guides pratiques en français : règles par pays, documents, éviter les arnaques, choisir son modèle.",
};

const fmt = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default function GuidesPage() {
  return (
    <>
      <PageHeader eyebrow="KBA-08 / Guides" title={<>Tout comprendre<br /><span className="text-blue-600">avant d'acheter.</span></>} intro="Des guides simples, en français, pour acheter une voiture à l'étranger sans mauvaise surprise." />
      <section className="py-14 md:py-20">
        <div className="container grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="group card flex flex-col p-7 transition-shadow hover:shadow-[0_12px_32px_-12px_rgba(11,31,58,0.25)]">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-label">
                <span className="text-blue-600">{g.category}</span>
                <span className="text-muted">{g.readingMinutes} min</span>
              </div>
              <h2 className="mt-4 text-[19px] font-semibold leading-snug text-ink">{g.title}</h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">{g.excerpt}</p>
              <div className="mt-auto flex items-center justify-between pt-6 text-[13px]">
                <span className="text-muted">{fmt(g.date)}</span>
                <ArrowRight className="h-4 w-4 text-silver-500 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
