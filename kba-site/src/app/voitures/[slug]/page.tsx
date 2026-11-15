import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, FileText, ShieldCheck, Video } from "lucide-react";
import { Gallery } from "@/components/Gallery";
import { CarCard } from "@/components/CarCard";
import { ExampleBadge, StatusBadge } from "@/components/ui";
import { WhatsAppGlyph } from "@/components/icons";
import { bodyLabel, cars, getCar, totalPort } from "@/data/cars";
import { site } from "@/data/site";
import { gnf, km, usd, waLink, xof } from "@/lib/format";

export function generateStaticParams() {
  return cars.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = getCar(params.slug);
  if (!c) return {};
  return {
    title: `${c.brand} ${c.model} ${c.year} · ${usd(totalPort(c))} rendu Conakry`,
    description: `${c.brand} ${c.model} ${c.version} ${c.year}, ${km(c.km)}, ${c.fuel}, ${c.gearbox}. Dossier vérifié, prix total jusqu'au port de Conakry. Réf. ${c.ref}.`,
    openGraph: c.photos[0] ? { images: [c.photos[0]] } : undefined,
  };
}

const docLabels: [keyof typeof cars[number]["docs"], string][] = [
  ["vin", "Numéro de châssis (VIN) vérifié"],
  ["registration", "Carte grise coréenne"],
  ["inspection", "Rapport d'inspection, traduit"],
  ["carHistory", "Historique d'accidents CarHistory, traduit"],
  ["video", "Vidéo à votre nom, sur demande"],
];

export default function CarPage({ params }: { params: { slug: string } }) {
  const c = getCar(params.slug);
  if (!c) notFound();
  const total = totalPort(c);
  const half = Math.round(c.price.vehicle / 2);
  const similar = cars.filter((x) => x.slug !== c.slug && (x.body === c.body || x.brand === c.brand)).slice(0, 3);
  const name = `${c.brand} ${c.model} ${c.version} ${c.year}`;
  const reserveMsg = `Bonjour KBA, je suis intéressé(e) par la ${name} (réf. ${c.ref}). Est-elle toujours disponible ?`;
  const videoMsg = `Bonjour KBA, pouvez-vous m'envoyer une vidéo à mon nom de la ${name} (réf. ${c.ref}) ? Mon nom : `;

  const specs: [string, string][] = [
    ["Année", `${c.year} (1re immatriculation ${c.firstRegistration.split("-").reverse().join("/")})`],
    ["Kilométrage", km(c.km)],
    ["Carburant", c.fuel],
    ["Boîte", c.gearbox],
    ["Moteur", c.engine],
    ["Puissance", c.power],
    ["Transmission", c.drive],
    ["Places", String(c.seats)],
    ["Couleur", c.color],
    ["Carrosserie", bodyLabel[c.body]],
    ["Volant", "À gauche"],
    ["Emplacement", c.location],
  ];

  return (
    <>
      <div className="border-b border-line bg-paper pt-[72px]">
        <div className="container flex items-center justify-between py-4 text-[13px]">
          <Link href="/voitures" className="inline-flex items-center gap-1.5 text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Toutes les voitures
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-label text-muted">{c.ref}</span>
        </div>
      </div>

      <section className="py-10 md:py-14">
        <div className="container grid gap-10 lg:grid-cols-[1.35fr_1fr]">
          <div>
            <Gallery car={c} />
            {c.isExample && (
              <p className="mt-4 rounded-md border border-line bg-paper p-4 text-[13px] text-muted">
                <strong className="text-ink">Voiture d'exemple.</strong> Cette fiche montre comment nos voitures sont présentées. Les vraies voitures et leurs prix sont publiés au lancement.
              </p>
            )}

            <div className="mt-12">
              <p className="eyebrow">Caractéristiques</p>
              <dl className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
                {specs.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 bg-white px-4 py-3 text-[14px]">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-right font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-12 grid gap-10 md:grid-cols-2">
              <div>
                <p className="eyebrow">Équipements</p>
                <ul className="mt-4 space-y-2.5 text-[14px]">
                  {c.equipment.map((e) => (
                    <li key={e} className="flex items-start gap-2.5 text-ink">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /> {e}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow">Défauts signalés</p>
                <ul className="mt-4 space-y-2.5 text-[14px]">
                  {c.defects.map((d) => (
                    <li key={d} className="flex items-start gap-2.5 text-ink">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" /> {d}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[13px] leading-relaxed text-muted">Nous montrons tous les défauts que nous voyons. Ils sont photographiés dans le dossier.</p>
              </div>
            </div>

            <div className="mt-12">
              <p className="eyebrow">Le dossier de la voiture</p>
              <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
                {docLabels.map(([k, l]) => (
                  <li key={k} className="flex items-center justify-between gap-4 px-4 py-3.5 text-[14px]">
                    <span className="flex items-center gap-2.5 text-ink">
                      {k === "video" ? <Video className="h-4 w-4 text-blue-600" /> : <FileText className="h-4 w-4 text-blue-600" />} {l}
                    </span>
                    <span className={c.docs[k] ? "font-mono text-[11px] uppercase tracking-wider text-ok" : "font-mono text-[11px] uppercase tracking-wider text-warn"}>{c.docs[k] ? "Disponible" : "En attente"}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13px] text-muted">Le dossier complet vous est envoyé sur WhatsApp avant tout paiement.</p>
            </div>
          </div>

          {/* Colonne de droite : prix et action */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={c.status} />
              {c.isExample && <ExampleBadge />}
            </div>
            <h1 className="mt-4 font-display text-3xl font-extrabold uppercase leading-[1.05] tracking-tight text-ink md:text-4xl">
              {c.brand} {c.model}
            </h1>
            <p className="mt-2 text-[15px] text-muted">
              {c.version} · {c.year} · {km(c.km)} · {c.fuel} · {c.gearbox}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {c.highlights.map((h) => (
                <span key={h} className="rounded-full border border-line px-3 py-1 text-[12px] text-ink">
                  {h}
                </span>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-line">
              <div className="p-5">
                <p className="font-mono text-[10px] uppercase tracking-label text-muted">Prix total rendu port de Conakry</p>
                <p className="mt-2 font-display text-4xl font-extrabold tracking-tight text-ink">{usd(total)}</p>
                <p className="mt-1 text-[13px] text-muted">
                  ≈ {gnf(total)} · ≈ {xof(total)}
                </p>
              </div>
              <dl className="space-y-2.5 border-t border-line p-5 text-[14px]">
                <div className="flex justify-between"><dt className="text-muted">Voiture (en Corée)</dt><dd className="font-medium">{usd(c.price.vehicle)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Transport maritime</dt><dd className="font-medium">{usd(c.price.freight)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Assurance transport</dt><dd className="font-medium">{usd(c.price.insurance)}</dd></div>
                <div className="flex justify-between border-t border-dashed border-line pt-2.5"><dt className="text-muted">Douane + port à Conakry (estimation)</dt><dd className="font-medium">{usd(c.customsGN[0])} – {usd(c.customsGN[1])}</dd></div>
              </dl>
              <div className="border-t border-line bg-paper p-5 text-[13px]">
                <p className="font-semibold text-ink">Paiement en 2 fois, à l'entreprise qui vend</p>
                <ol className="mt-2 space-y-1.5 text-muted">
                  <li>1. Acompte : {usd(half)}, après la vidéo à votre nom</li>
                  <li>2. Solde : {usd(total - half)}, quand vous avez vérifié le B/L</li>
                  <li>3. Douane : au transitaire, à l'arrivée</li>
                </ol>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <a href={waLink(reserveMsg)} target="_blank" rel="noopener" className="btn-whatsapp py-3.5">
                <WhatsAppGlyph className="h-4 w-4" /> Réserver sur WhatsApp
              </a>
              <a href={waLink(videoMsg)} target="_blank" rel="noopener" className="btn-outline py-3.5">
                <Video className="h-4 w-4" /> Demander une vidéo à mon nom
              </a>
            </div>
            <p className="mt-4 flex items-start gap-2 text-[12.5px] leading-relaxed text-muted">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
              Vous payez uniquement l'entreprise inscrite sur votre facture, jamais une personne. Taux de conversion indicatif du {site.ratesDate}. Douane estimée, confirmée par écrit par le transitaire avant la commande.
            </p>
          </aside>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="border-t border-line bg-paper py-16">
          <div className="container">
            <p className="eyebrow">Voitures similaires</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((s) => (
                <CarCard key={s.slug} car={s} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
