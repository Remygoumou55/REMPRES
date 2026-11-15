import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { CarCard } from "@/components/CarCard";
import { CtaBand } from "@/components/CtaBand";
import { PageHeader } from "@/components/ui";
import { cars } from "@/data/cars";
import { countries, getCountry } from "@/data/countries";

export function generateStaticParams() {
  return countries.map((c) => ({ slug: c.slug }));
}
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = getCountry(params.slug);
  return c ? { title: `Voiture coréenne livrée en ${c.name}`, description: `${c.summary} Âge maximum : ${c.maxAge}. Arrivée : ${c.port}.` } : {};
}

export default function CountryPage({ params }: { params: { slug: string } }) {
  const c = getCountry(params.slug);
  if (!c) notFound();
  const yearsMatch = c.maxAge.match(/^(\d+) ans/);
  const minYear = yearsMatch ? 2026 - +yearsMatch[1] : 0;
  const ok = cars.filter((x) => x.status === "disponible" && x.year >= minYear).slice(0, 3);
  return (
    <>
      <PageHeader eyebrow={`Pays livrés / ${c.flag}`} title={<>Livraison<br /><span className="text-blue-600">{c.name}.</span></>} intro={c.summary}>
        <dl className="mt-10 grid max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          {[["Âge maximum", c.maxAge], ["Arrivée", c.port], ["Délai indicatif", c.delay]].map(([k, v]) => (
            <div key={k} className="bg-white p-4">
              <dt className="font-mono text-[10px] uppercase tracking-label text-muted">{k}</dt>
              <dd className="mt-1.5 text-[14px] font-semibold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </PageHeader>
      <section className="py-14 md:py-20">
        <div className="container grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="eyebrow">À savoir</p>
            <ul className="mt-6 space-y-4">
              {c.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-ok" /> {p}
                </li>
              ))}
            </ul>
            {c.transit && <p className="mt-6 text-[14px] text-muted">{c.transit}.</p>}
            <p className="mt-8 text-[13px] text-muted">
              Source : {c.source.url.startsWith("http") ? <a href={c.source.url} target="_blank" rel="noopener" className="text-blue-600 hover:underline">{c.source.label}</a> : <Link href={c.source.url} className="text-blue-600 hover:underline">{c.source.label}</Link>}. Les règles changent : nous les faisons confirmer par un transitaire agréé avant chaque vente.
            </p>
          </div>
          <div className="card h-fit p-6">
            <p className="eyebrow">La douane</p>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">Les droits et taxes dépendent de la valeur, de l'âge et du type de voiture. Avant votre commande, vous recevez une <strong className="text-ink">estimation écrite</strong> de notre transitaire partenaire. Vous payez ensuite la douane directement au transitaire, contre un reçu officiel.</p>
          </div>
        </div>
      </section>
      {ok.length > 0 && (
        <section className="border-t border-line bg-paper py-14">
          <div className="container">
            <p className="eyebrow">Voitures compatibles avec {c.name}</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{ok.map((x) => <CarCard key={x.slug} car={x} />)}</div>
          </div>
        </section>
      )}
      <CtaBand />
    </>
  );
}
