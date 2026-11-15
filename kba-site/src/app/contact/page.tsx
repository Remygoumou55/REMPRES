import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { WhatsAppGlyph } from "@/components/icons";
import { site } from "@/data/site";
import { waLink } from "@/lib/format";

export const metadata: Metadata = { title: "Contact", description: `Contactez Korea Business Auto sur WhatsApp, par téléphone ou à notre bureau de ${site.address.city}.` };

export default function Contact() {
  const rows = [
    { icon: Phone, k: "Téléphone / WhatsApp", v: site.phoneDisplay },
    { icon: Mail, k: "E-mail", v: site.email },
    { icon: MapPin, k: "Bureau", v: `${site.address.street}, ${site.address.city}, ${site.address.country}` },
    { icon: Clock, k: "Horaires", v: site.hours },
  ];
  return (
    <>
      <PageHeader eyebrow="KBA / Contact" title={<>Parlons de<br /><span className="text-blue-600">votre voiture.</span></>} intro={`Le plus rapide : WhatsApp. Nous répondons en ${site.responseTime}, du lundi au samedi.`} />
      <section className="py-14 md:py-20">
        <div className="container grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div className="card divide-y divide-line">
            {rows.map((r) => (
              <div key={r.k} className="flex items-start gap-4 p-6">
                <r.icon className="mt-0.5 h-5 w-5 text-blue-600" strokeWidth={1.7} />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-label text-muted">{r.k}</p>
                  <p className="mt-1 text-[15px] font-medium text-ink">{r.v}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col justify-center rounded-lg bg-navy-900 p-8 md:p-10">
            <p className="eyebrow-dark">WhatsApp</p>
            <h2 className="h-display mt-3 text-3xl text-white">Une question ? Écrivez-nous.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/70">Dites-nous quelle voiture vous intéresse, ou ce que vous cherchez. Un membre de l'équipe vous répond, en français.</p>
            <a href={waLink("Bonjour KBA, j'ai une question.")} target="_blank" rel="noopener" className="btn-whatsapp mt-8 w-fit">
              <WhatsAppGlyph className="h-4 w-4" /> Ouvrir WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
