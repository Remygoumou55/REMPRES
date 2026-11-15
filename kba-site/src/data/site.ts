/**
 * Réglages généraux du site KBA.
 * ⚠️ À COMPLÉTER avant la mise en ligne : tout ce qui est marqué TODO.
 */
export const site = {
  name: "Korea Business Auto",
  short: "KBA",
  tagline: "De la Corée à vos clés, en toute confiance.",
  description:
    "Korea Business Auto sélectionne et vérifie des voitures d'occasion en Corée du Sud et les fait livrer en Guinée, au Sénégal, au Mali et dans toute l'Afrique de l'Ouest. Prix total affiché, documents coréens traduits, paiement à l'entreprise qui vend, suivi jusqu'aux clés.",
  url: "https://koreabusinessauto.com", // TODO : nom de domaine à acheter
  // TODO : numéro WhatsApp Business définitif (format international, sans + ni espaces)
  whatsapp: "821072229167",
  phoneDisplay: "+82 10-7222-9167",
  email: "contact@koreabusinessauto.com", // TODO : créer l'adresse
  address: {
    city: "Conakry",
    country: "Guinée",
    street: "Adresse du bureau à compléter", // TODO
  },
  korea: { city: "Incheon", country: "Corée du Sud" },
  legal: {
    rccm: "En cours d'immatriculation", // TODO : numéro RCCM dès qu'il est obtenu
    nif: "En cours", // TODO
  },
  hours: "Lundi au samedi, 8h – 22h (heure de Conakry)",
  responseTime: "moins de 2 heures",
  social: {
    facebook: "https://facebook.com/", // TODO
    tiktok: "https://tiktok.com/", // TODO
  },
  /** Taux indicatifs pour afficher les prix en monnaie locale. TODO : mettre à jour chaque semaine. */
  rates: { GNF: 8650, XOF: 600 },
  ratesDate: "15/11/2026",
} as const;

export const nav = [
  { href: "/voitures", label: "Voitures" },
  { href: "/comment-acheter", label: "Comment acheter" },
  { href: "/verifiez-nous", label: "Vérifiez-nous" },
  { href: "/trouvez-ma-voiture", label: "Trouvez-la pour moi" },
  { href: "/pays", label: "Pays livrés" },
  { href: "/guides", label: "Guides" },
] as const;
