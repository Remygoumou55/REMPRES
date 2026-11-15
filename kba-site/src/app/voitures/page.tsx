import type { Metadata } from "next";
import { Catalogue } from "@/components/Catalogue";
import { CtaBand } from "@/components/CtaBand";
import { PageHeader } from "@/components/ui";
import { brands, cars } from "@/data/cars";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Voitures d'occasion coréennes disponibles",
  description: "Hyundai, Kia, Toyota : voitures d'occasion vérifiées en Corée du Sud, avec le prix total jusqu'au port de Conakry.",
};

export default function VoituresPage() {
  return (
    <>
      <PageHeader
        eyebrow="KBA-01 / Catalogue"
        title={<>Voitures disponibles<br /><span className="text-blue-600">en Corée.</span></>}
        intro={<>Chaque prix est le <strong className="font-semibold text-ink">total rendu au port de Conakry</strong> : voiture, bateau et assurance. La douane est estimée sur chaque fiche. Conversion indicative au taux du {site.ratesDate}.</>}
      />
      <section className="py-12 md:py-16">
        <div className="container">
          <Catalogue cars={cars} brands={brands} />
        </div>
      </section>
      <CtaBand title="Votre voiture n'est pas dans la liste ?" text="Nos parcs partenaires ont des centaines d'autres voitures. Décrivez-nous la vôtre, nous la trouvons." />
    </>
  );
}
