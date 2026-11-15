/** Textes réutilisés : les 10 étapes, les documents, la FAQ, les vérifications. */

export const steps = [
  { n: "01", title: "Le choix", text: "Vous choisissez une voiture sur le site ou sur nos pages. Vous recevez sa fiche complète et un devis jusqu'au port.", proof: "Fiche KBA + devis détaillé" },
  { n: "02", title: "La vérification", text: "Nous reconfirmons que la voiture est disponible et nous la filmons avec une feuille à votre nom et son numéro de châssis.", proof: "Vidéo à votre nom, VIN visible" },
  { n: "03", title: "Le contrat", text: "Bon de commande et facture du parc à votre nom : prix, délais et remboursement écrits noir sur blanc.", proof: "Contrat en français" },
  { n: "04", title: "L'acompte de 50 %", text: "Vous payez par virement l'entreprise coréenne qui vend la voiture. Jamais un compte personnel.", proof: "Reçu du parc" },
  { n: "05", title: "La préparation", text: "Le parc radie l'immatriculation coréenne, prépare les papiers d'export et réserve le bateau.", proof: "Certificat de radiation" },
  { n: "06", title: "L'embarquement", text: "La voiture monte à bord. Vous recevez le connaissement (B/L) avec votre nom comme destinataire.", proof: "B/L + photos du chargement" },
  { n: "07", title: "Le solde de 50 %", text: "Vous vérifiez vous-même le B/L sur le site de la compagnie maritime, puis vous payez le reste.", proof: "Reçu + B/L original ou télex" },
  { n: "08", title: "Le voyage", text: "Vous suivez le bateau en direct sur votre téléphone. Nous vous écrivons à chaque étape.", proof: "Lien de suivi du navire" },
  { n: "09", title: "L'arrivée", text: "Vous payez la douane directement au transitaire et vous inspectez la voiture au port.", proof: "Reçus officiels de douane" },
  { n: "10", title: "Les clés", text: "Remise des clés à Conakry, avec tous les papiers pour immatriculer la voiture.", proof: "Dossier complet à votre nom" },
] as const;

export const documentsByMoment = [
  { moment: "Avant de payer", items: ["Fiche voiture KBA (photos, caractéristiques, défauts)", "Carte grise coréenne", "Rapport d'inspection traduit", "Historique CarHistory traduit", "Vidéo à votre nom avec le VIN", "Devis détaillé + estimation de douane", "Certificat d'entreprise du vendeur"] },
  { moment: "À l'acompte", items: ["Bon de commande signé", "Facture proforma à votre nom", "Reçu de l'acompte"] },
  { moment: "À l'embarquement", items: ["Certificat de radiation pour export (même VIN)", "Connaissement (B/L) à votre nom", "Certificat d'assurance maritime"] },
  { moment: "À l'arrivée", items: ["Facture commerciale finale", "B/L original ou télex release", "Reçus de douane et du transitaire"] },
] as const;

export const checks = [
  { title: "Vérifiez l'entreprise qui vend", text: "Chaque parc partenaire a un numéro d'entreprise coréen à 10 chiffres. Nous vous le donnons : il se vérifie gratuitement sur le site officiel des impôts coréens (HomeTax). Il doit être « actif »." },
  { title: "Le même numéro de châssis partout", text: "Le VIN doit être identique sur la carte grise, le rapport d'inspection, la vidéo, le certificat d'export et le B/L. Un seul chiffre différent : on arrête tout." },
  { title: "Une vidéo à votre nom", text: "Avant tout paiement, vous recevez une vidéo de la voiture avec une feuille portant votre nom, la date et le VIN. Une photo copiée sur Internet ne peut pas faire ça." },
  { title: "Le B/L vérifié par vous-même", text: "Le solde se paie seulement quand vous avez vérifié le connaissement sur le site officiel de la compagnie maritime. Pas sur un lien que nous vous envoyons." },
  { title: "Un compte d'entreprise, jamais personnel", text: "Vous payez uniquement l'entreprise inscrite sur votre facture. Nous ne demandons jamais Western Union, ni un compte au nom d'une personne." },
  { title: "Rencontrez-nous", text: "Passez nous voir à Conakry, ou demandez un appel vidéo depuis le parc en Corée. Une entreprise sérieuse montre son visage." },
] as const;

export const scamSignals = [
  "Un prix très en dessous du marché.",
  "Pas de numéro de châssis avant le paiement.",
  "Refus d'un appel vidéo ou d'une vidéo à votre nom.",
  "Paiement demandé sur un compte personnel ou par Western Union.",
  "Pression : « payez aujourd'hui, un autre client attend ».",
  "Un numéro de compte qui change en cours de route.",
] as const;

export const verifiedPoints = [
  "Numéro de châssis identique sur tous les documents",
  "Historique d'accidents et d'inondation (CarHistory)",
  "Rapport d'inspection coréen",
  "Kilométrage cohérent avec l'historique",
  "Âge conforme aux règles du pays de livraison",
  "Volant à gauche",
  "Carburant précisé (pas de GPL par défaut)",
  "Défauts photographiés et signalés",
] as const;

export type FaqItem = { q: string; a: string };
export const faq: { group: string; items: FaqItem[] }[] = [
  {
    group: "Confiance",
    items: [
      { q: "Comment savoir que vous n'êtes pas une arnaque ?", a: "Ne nous croyez pas sur parole : vérifiez. Vous recevez le numéro d'entreprise du vendeur coréen, une vidéo de la voiture à votre nom, et vous vérifiez vous-même le B/L. Vous payez uniquement une entreprise enregistrée, jamais une personne. Et vous pouvez nous rencontrer à Conakry." },
      { q: "À qui j'envoie l'argent ?", a: "Directement à l'entreprise coréenne qui vend la voiture, par virement, avec une facture à votre nom. La douane, vous la payez au transitaire. L'argent de la voiture ne passe jamais par un compte personnel." },
      { q: "Et si vous disparaissez avec mon argent ?", a: "Votre argent est chez une entreprise enregistrée en Corée, vérifiable, et votre contrat prévoit le remboursement si la voiture ne peut pas partir. C'est pour cette raison que nous ne recevons jamais le prix de la voiture nous-mêmes." },
      { q: "Je peux payer par Western Union ou Orange Money ?", a: "Non pour le prix de la voiture : uniquement par virement bancaire, traçable. C'est une protection pour vous." },
    ],
  },
  {
    group: "La voiture",
    items: [
      { q: "La voiture a-t-elle eu un accident ?", a: "Vous recevez son historique officiel coréen (CarHistory), traduit en français, avant de payer. Il montre les sinistres déclarés à l'assurance et les inondations." },
      { q: "Le kilométrage est-il vrai ?", a: "Il est contrôlé avec la photo du compteur, le rapport d'inspection et l'historique coréen. Les trois doivent être cohérents." },
      { q: "Pourquoi des voitures coréennes ?", a: "Elles ont le volant à gauche (obligatoire en Guinée, au Mali, au Burkina), elles sont bien entretenues, et les pièces Hyundai et Kia se trouvent facilement en Afrique de l'Ouest." },
      { q: "Vous montrez les défauts ?", a: "Toujours. Chaque défaut est photographié et écrit sur la fiche. Une voiture d'occasion sans défaut, ça n'existe pas : ce qui compte, c'est de le savoir avant." },
    ],
  },
  {
    group: "Prix et paiement",
    items: [
      { q: "Le prix affiché comprend quoi ?", a: "La voiture, le transport en bateau et l'assurance jusqu'au port. La douane est estimée à part, car vous la payez vous-même au transitaire. Aucun autre frais ne s'ajoute." },
      { q: "Je paie quand ?", a: "50 % à la commande, après avoir reçu la vidéo à votre nom. 50 % quand la voiture est sur le bateau, après avoir vérifié le B/L. Puis la douane à l'arrivée." },
      { q: "Le prix peut-il changer pendant le voyage ?", a: "Non. Le prix de la voiture est bloqué dès l'acompte. Seule la douane dépend de l'administration ; nous vous en donnons une estimation écrite avant." },
    ],
  },
  {
    group: "Transport et livraison",
    items: [
      { q: "Combien de temps pour recevoir la voiture ?", a: "En général 45 à 70 jours entre l'acompte et les clés pour Conakry, selon les départs de bateaux. Nous vous donnons les dates prévues dès la commande." },
      { q: "Comment je suis mon bateau ?", a: "Vous recevez le nom du navire et le numéro de B/L. Vous suivez sa position en direct sur MarineTraffic, et nous vous écrivons à chaque étape." },
      { q: "Je vis en Europe, qui récupère la voiture ?", a: "La personne que vous désignez par écrit, accompagnée par notre équipe à Conakry. Vous suivez tout sur WhatsApp." },
      { q: "Vous livrez dans quels pays ?", a: "Guinée en priorité, puis Sénégal, Mali, Côte d'Ivoire, Togo et Bénin. Nous vérifions la limite d'âge de votre pays avant de vous proposer une voiture." },
    ],
  },
];
