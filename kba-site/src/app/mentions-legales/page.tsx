import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { site } from "@/data/site";

export const metadata: Metadata = { title: "Mentions légales", robots: { index: false } };

export default function Mentions() {
  return (
    <>
      <PageHeader eyebrow="KBA / Légal" title="Mentions légales" />
      <section className="py-14">
        <div className="container prose-kba max-w-3xl">
          <p><strong>À compléter avant la mise en ligne.</strong> Ces informations doivent être vérifiées par un juriste.</p>
          <h2>Éditeur du site</h2>
          <p>{site.name} ({site.short}). RCCM : {site.legal.rccm}. NIF : {site.legal.nif}. Adresse : {site.address.street}, {site.address.city}, {site.address.country}. Téléphone : {site.phoneDisplay}. E-mail : {site.email}.</p>
          <h2>Hébergement</h2>
          <p>Nom et adresse de l'hébergeur à compléter.</p>
          <h2>Photos et informations des voitures</h2>
          <p>Les photos et caractéristiques sont fournies par nos parcs partenaires en Corée du Sud et vérifiées par notre équipe. Les voitures marquées « Exemple » servent uniquement à présenter le site.</p>
          <h2>Données personnelles</h2>
          <p>Ce site ne collecte pas de données par formulaire : les demandes s'ouvrent dans WhatsApp. Les informations que vous nous envoyez servent uniquement à traiter votre demande.</p>
        </div>
      </section>
    </>
  );
}
