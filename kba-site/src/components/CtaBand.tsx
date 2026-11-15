import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { waLink } from "@/lib/format";
import { WhatsAppGlyph } from "./icons";

export function CtaBand({ title = "Votre prochaine voiture vient de Corée.", text = "Dites-nous ce que vous cherchez : nous vous envoyons des voitures vérifiées, avec le prix total jusqu'à Conakry." }: { title?: string; text?: string }) {
  return (
    <section className="bg-navy-900">
      <div className="container grid gap-8 py-16 md:grid-cols-[1.4fr_1fr] md:items-center md:py-20">
        <div>
          <p className="eyebrow-dark">Passez à l'action</p>
          <h2 className="h-display mt-3 text-3xl text-white md:text-5xl">{title}</h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/70">{text}</p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <a href={waLink("Bonjour KBA, je cherche une voiture.")} target="_blank" rel="noopener" className="btn-whatsapp w-full md:w-auto">
            <WhatsAppGlyph className="h-4 w-4" /> Écrire sur WhatsApp
          </a>
          <Link href="/trouvez-ma-voiture" className="btn-ghost-dark w-full md:w-auto">
            Décrire la voiture que je cherche <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
