import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Conditions de vente", robots: { index: false } };

export default function Conditions() {
  return (
    <>
      <PageHeader eyebrow="KBA / Légal" title="Conditions de vente" intro="Résumé en langage simple. Le contrat signé à la commande fait foi." />
      <section className="py-14">
        <div className="container prose-kba max-w-3xl">
          <p><strong>Projet à faire valider par un avocat avant la mise en ligne.</strong></p>
          <h2>1. Le rôle de KBA</h2>
          <p>Korea Business Auto sélectionne, vérifie et présente des voitures appartenant à des parcs automobiles partenaires en Corée du Sud, et accompagne l'acheteur jusqu'à la remise des clés. Le vendeur de la voiture est le parc, dont le nom figure sur la facture.</p>
          <h2>2. Le prix</h2>
          <p>Le prix affiché comprend la voiture, le transport maritime et l'assurance jusqu'au port indiqué. Il est garanti 7 jours, puis bloqué au paiement de l'acompte. Les droits de douane et frais de port à l'arrivée sont estimés et payés par l'acheteur directement au transitaire.</p>
          <h2>3. Le paiement</h2>
          <ul>
            <li>Acompte de 50 % par virement à l'entreprise qui vend, après réception de la vidéo au nom de l'acheteur.</li>
            <li>Solde de 50 % après l'embarquement, sur présentation du connaissement (B/L) au nom de l'acheteur.</li>
            <li>Aucun paiement du prix de la voiture n'est accepté sur un compte personnel.</li>
          </ul>
          <h2>4. Remboursement</h2>
          <ul>
            <li>Si la voiture ne peut pas être embarquée (vendue entre-temps, problème de documents), l'acompte est remboursé à 100 % dans un délai de 15 jours (à confirmer).</li>
            <li>Annulation par l'acheteur avant l'embarquement : conditions et frais écrits dans le bon de commande.</li>
          </ul>
          <h2>5. État de la voiture</h2>
          <p>La voiture est vendue d'occasion, dans l'état décrit dans son dossier (photos, défauts signalés, rapport d'inspection, historique). En cas d'écart important constaté au port, le vendeur propose une remise, une réparation ou un remboursement, selon le contrat.</p>
          <h2>6. Délais</h2>
          <p>Les délais sont indicatifs et dépendent des compagnies maritimes. L'acheteur est informé de chaque étape et de tout retard.</p>
        </div>
      </section>
    </>
  );
}
