import Link from "next/link";
import { ArrowRight, Banknote, Check, FileCheck2, Landmark, Ship, Video } from "lucide-react";
import { CarCard } from "@/components/CarCard";
import { CarPhoto } from "@/components/CarPhoto";
import { CtaBand } from "@/components/CtaBand";
import { Faq } from "@/components/Faq";
import { Ticker } from "@/components/Ticker";
import { ExampleBadge, SectionHeading } from "@/components/ui";
import { WhatsAppGlyph } from "@/components/icons";
import { cars, totalPort } from "@/data/cars";
import { countries } from "@/data/countries";
import { faq, steps } from "@/data/content";
import { usd, waLink } from "@/lib/format";

export default function Home() {
  const featured = cars.filter((c) => c.status !== "livree").slice(0, 6);
  const hero = cars[0];
  const homeFaq = faq.flatMap((g) => g.items).slice(0, 6);

  return (
    <>
      {/* HÉROS */}
      <section className="relative overflow-hidden bg-navy-900 pt-[72px]">
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="container relative grid gap-14 pb-16 pt-14 md:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pb-24">
          <div>
            <p className="eyebrow-dark">KBA-00 / Voitures coréennes · Afrique de l'Ouest</p>
            <h1 className="h-display mt-5 text-[3.1rem] text-white sm:text-7xl xl:text-[5.4rem]">
              De la Corée
              <br />
              <span className="text-blue-400">à vos clés.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-white/75">
              Nous sélectionnons des voitures d'occasion dans des parcs vérifiés en Corée du Sud, nous vous montrons tout, même les défauts, et nous vous accompagnons jusqu'à la remise des clés à Conakry.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/voitures" className="btn-primary">
                Voir les voitures <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={waLink("Bonjour KBA, je cherche une voiture.")} target="_blank" rel="noopener" className="btn-ghost-dark">
                <WhatsAppGlyph className="h-4 w-4" /> Parler à un conseiller
              </a>
            </div>
            <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/10 pt-8 sm:grid-cols-4">
              {[
                ["0 $", "de frais cachés"],
                ["50 / 50", "paiement en 2 fois"],
                ["10", "étapes suivies"],
                ["< 2 h", "pour vous répondre"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="sr-only">{l}</dt>
                  <dd className="font-display text-3xl font-extrabold text-white">{v}</dd>
                  <dd className="mt-1 font-mono text-[10px] uppercase tracking-label text-white/50">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Le « dossier » d'une voiture : ce que le client reçoit avant de payer */}
          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
              <div className="relative">
                <CarPhoto car={hero} className="aspect-[16/11]" priority sizes="(min-width:1024px) 40vw, 100vw" />
                <span className="absolute left-4 top-4 rounded bg-navy-900/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-label text-white">Dossier {hero.ref}</span>
                {hero.isExample && <ExampleBadge className="absolute right-4 top-4" />}
              </div>
              <div className="p-6">
                <p className="text-[15px] font-semibold text-ink">
                  {hero.brand} {hero.model} {hero.version} · {hero.year}
                </p>
                <ul className="mt-4 space-y-2.5 text-[14px]">
                  {["Numéro de châssis identique sur tous les papiers", "Historique d'accidents coréen traduit", "Rapport d'inspection du parc", "Vidéo de la voiture à votre nom"].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-muted">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
                  <span className="font-mono text-[10px] uppercase tracking-label text-muted">Total rendu Conakry</span>
                  <span className="font-display text-2xl font-extrabold text-ink">{usd(totalPort(hero))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Ticker />
      </section>

      {/* VOITURES */}
      <section className="py-20 md:py-28">
        <div className="container">
          <SectionHeading
            eyebrow="KBA-01 / Voitures disponibles"
            title={<>Choisies en Corée.<br />Vérifiées pour vous.</>}
            intro="Chaque voiture a un numéro KBA, un dossier complet et un prix total jusqu'au port de Conakry. Pas de prix « à demander »."
            action={
              <Link href="/voitures" className="btn-outline shrink-0">
                Tout le catalogue <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <CarCard key={c.slug} car={c} />
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="border-y border-line bg-paper py-20 md:py-28">
        <div className="container">
          <SectionHeading
            eyebrow="KBA-02 / Comment acheter"
            title={<>Une preuve à chaque étape.</>}
            intro="Vous ne payez jamais « dans le vide » : à chaque paiement, vous recevez un document qui prouve que tout avance."
            action={
              <Link href="/comment-acheter" className="btn-outline shrink-0">
                Les 10 étapes en détail <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-5">
            {[steps[0], steps[1], steps[3], steps[6], steps[9]].map((s, i) => (
              <li key={s.n} className="bg-white p-6">
                <span className="font-mono text-[11px] text-blue-600">0{i + 1}</span>
                <h3 className="mt-3 text-[15px] font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{s.text}</p>
                <p className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ok">
                  <FileCheck2 className="h-3.5 w-3.5" /> {s.proof}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* QUI PAIE QUI */}
      <section className="py-20 md:py-28">
        <div className="container grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <SectionHeading
            eyebrow="KBA-03 / Votre argent"
            title={<>Votre argent ne passe jamais par un compte personnel.</>}
            intro="Vous payez la voiture à l'entreprise coréenne qui la vend, et la douane au transitaire. KBA est rémunérée par le vendeur. Personne ne vous demandera un Western Union."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Landmark, who: "Le prix de la voiture", to: "à l'entreprise qui vend", detail: "Virement 50 % + 50 %, facture à votre nom" },
              { icon: Ship, who: "La douane", to: "au transitaire agréé", detail: "Payée par vous, avec un reçu officiel" },
              { icon: Banknote, who: "Notre commission", to: "payée par le vendeur", detail: "Déjà comprise dans le prix affiché" },
            ].map((b) => (
              <div key={b.who} className="card p-6">
                <b.icon className="h-6 w-6 text-blue-600" strokeWidth={1.6} />
                <p className="mt-5 text-[15px] font-semibold text-ink">{b.who}</p>
                <p className="mt-1 text-[14px] font-medium text-blue-600">{b.to}</p>
                <p className="mt-3 text-[13px] leading-relaxed text-muted">{b.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREUVES */}
      <section className="bg-navy-900 py-20 md:py-28">
        <div className="container">
          <SectionHeading
            dark
            eyebrow="KBA-04 / Vérifiez-nous"
            title={<>Ne nous croyez pas.<br />Vérifiez.</>}
            intro="Six vérifications simples, que vous faites vous-même avant de payer. Une entreprise sérieuse n'a rien à cacher."
            action={
              <Link href="/verifiez-nous" className="btn-ghost-dark shrink-0">
                Comment nous vérifier <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {[
              { icon: FileCheck2, t: "Numéro d'entreprise", d: "Celui du vendeur coréen, vérifiable sur le site officiel des impôts coréens." },
              { icon: Video, t: "Vidéo à votre nom", d: "La voiture filmée avec votre nom, la date et son numéro de châssis." },
              { icon: Ship, t: "B/L à votre nom", d: "Le document du bateau, que vous vérifiez vous-même chez la compagnie." },
              { icon: Landmark, t: "Compte d'entreprise", d: "Jamais de compte personnel, jamais de Western Union." },
            ].map((x) => (
              <div key={x.t} className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
                <x.icon className="h-6 w-6 text-blue-400" strokeWidth={1.6} />
                <p className="mt-5 text-[15px] font-semibold text-white">{x.t}</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/60">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAYS */}
      <section className="py-20 md:py-28">
        <div className="container">
          <SectionHeading
            eyebrow="KBA-05 / Pays livrés"
            title={<>Conakry d'abord.<br />Toute l'Afrique de l'Ouest ensuite.</>}
            intro="Avant de vous proposer une voiture, nous vérifions la limite d'âge et les règles de votre pays."
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((c) => (
              <Link key={c.slug} href={`/pays/${c.slug}`} className="group bg-white p-6 transition-colors hover:bg-paper">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-blue-600">{c.flag}</span>
                  <ArrowRight className="h-4 w-4 text-silver-500 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                </div>
                <h3 className="mt-3 font-display text-xl font-extrabold uppercase tracking-tight text-ink">{c.name}</h3>
                <p className="mt-2 text-[13.5px] text-muted">{c.summary}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-[12.5px]">
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-label text-muted">Âge max.</dt>
                    <dd className="mt-1 font-medium text-ink">{c.maxAge}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-label text-muted">Arrivée</dt>
                    <dd className="mt-1 font-medium text-ink">{c.port}</dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TROUVEZ-LA POUR MOI */}
      <section className="border-y border-line bg-paper py-16">
        <div className="container grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div>
            <p className="eyebrow">KBA-06 / Sur mesure</p>
            <h2 className="h-section mt-3">Vous ne trouvez pas votre voiture ?</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
              Dites-nous la marque, le modèle, l'année et votre budget, ou envoyez le lien d'une annonce coréenne. Notre équipe à Incheon la cherche dans les parcs et vous répond sous 24 à 48 heures.
            </p>
          </div>
          <div className="md:text-right">
            <Link href="/trouvez-ma-voiture" className="btn-primary">
              Décrire ma voiture <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28">
        <div className="container grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading className="md:items-start" eyebrow="KBA-07 / Questions" title={<>Vos questions, nos réponses.</>} intro={<>Vous ne trouvez pas votre réponse ? <Link href="/faq" className="font-medium text-blue-600 hover:underline">Toutes les questions</Link> ou écrivez-nous sur WhatsApp.</>} />
          <Faq items={homeFaq} />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
