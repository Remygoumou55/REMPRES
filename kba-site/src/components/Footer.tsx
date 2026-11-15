import Link from "next/link";
import { site } from "@/data/site";
import { countries } from "@/data/countries";
import { waLink } from "@/lib/format";

export function Footer() {
  const cols = [
    { title: "Acheter", links: [["/voitures", "Toutes les voitures"], ["/trouvez-ma-voiture", "Trouvez-la pour moi"], ["/comment-acheter", "Comment acheter"], ["/faq", "Questions fréquentes"]] },
    { title: "Confiance", links: [["/verifiez-nous", "Vérifiez-nous"], ["/guides/verifier-vendeur-voiture-coree", "Éviter les arnaques"], ["/conditions-de-vente", "Conditions de vente"], ["/mentions-legales", "Mentions légales"]] },
    { title: "Pays livrés", links: countries.map((c) => [`/pays/${c.slug}`, c.name]) },
    { title: "KBA", links: [["/a-propos", "Qui sommes-nous"], ["/guides", "Guides"], ["/contact", "Contact"]] },
  ] as const;
  return (
    <footer className="bg-navy-950 text-white/70">
      <div className="container grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/kba-logo-sombre.svg" alt="Korea Business Auto" width={600} height={350} className="h-24 w-auto" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed">
            Voitures d'occasion sélectionnées en Corée du Sud, vérifiées et livrées en Afrique de l'Ouest. {site.tagline}
          </p>
          <a href={waLink("Bonjour KBA !")} className="mt-6 inline-block font-mono text-sm text-white hover:text-blue-400">
            WhatsApp · {site.phoneDisplay}
          </a>
          <p className="mt-1 font-mono text-sm">{site.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {cols.map((c) => (
            <div key={c.title}>
              <p className="eyebrow-dark">{c.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {c.links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-2 py-6 font-mono text-[11px] uppercase tracking-wider text-white/45 md:flex-row md:justify-between">
          <span>© {new Date().getFullYear()} {site.name} · {site.address.city}, {site.address.country} · {site.korea.city}, {site.korea.country}</span>
          <span>RCCM : {site.legal.rccm} · NIF : {site.legal.nif}</span>
        </div>
      </div>
    </footer>
  );
}
