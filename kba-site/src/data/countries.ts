/**
 * Pays livrés. Règles relevées en novembre 2026 : elles changent souvent.
 * TODO : faire confirmer par un transitaire agréé avant chaque vente.
 */
export interface Country {
  slug: string;
  name: string;
  flag: string; // code ISO pour l'affichage
  priority: number;
  maxAge: string;
  port: string;
  transit?: string;
  delay: string;
  currency: "GNF" | "XOF" | "EUR";
  summary: string;
  points: string[];
  source: { label: string; url: string };
}

export const countries: Country[] = [
  {
    slug: "guinee",
    name: "Guinée",
    flag: "GN",
    priority: 1,
    maxAge: "13 ans",
    port: "Port autonome de Conakry",
    delay: "45 à 70 jours après l'acompte",
    currency: "GNF",
    summary: "Notre base. Remise des clés à Conakry, avec notre transitaire partenaire.",
    points: [
      "Âge maximum : 13 ans depuis la première mise en circulation (décret de 2020, en vigueur depuis juillet 2021).",
      "Les voitures à volant à droite sont interdites. Les voitures coréennes ont le volant à gauche.",
      "Un contrôle technique est exigé avant l'embarquement : il est organisé en Corée.",
      "Les formalités de douane passent par le guichet unique GUCEG, via le transitaire.",
    ],
    source: { label: "Avis MSC sur le décret D/2020/298", url: "https://ajot.com/news/msc-reports-on-new-regulation-on-importation-of-vehicles-scopeusa-toguinea-effective-july-15th-2021" },
  },
  {
    slug: "senegal",
    name: "Sénégal",
    flag: "SN",
    priority: 2,
    maxAge: "10 ans",
    port: "Port de Dakar",
    delay: "45 à 70 jours après l'acompte",
    currency: "XOF",
    summary: "Limite d'âge portée à 10 ans en octobre 2025 : beaucoup plus de choix.",
    points: [
      "Âge maximum : 10 ans pour les voitures particulières (décret n° 2025-1752 du 24/10/2025).",
      "Le bordereau électronique de suivi des cargaisons (BSC) est obligatoire.",
      "Dakar est aussi une porte d'entrée vers le Mali.",
    ],
    source: { label: "Le Soleil, octobre 2025", url: "https://lesoleil.sn/actualites/economie/le-senegal-releve-a-10-et-15-ans-la-limite-dage-des-vehicules-doccasion-importes-decret/" },
  },
  {
    slug: "mali",
    name: "Mali",
    flag: "ML",
    priority: 3,
    maxAge: "Pas de limite stricte (à confirmer)",
    port: "Via Conakry ou Dakar",
    transit: "Transit routier depuis le port, organisé avec le transitaire",
    delay: "55 à 85 jours après l'acompte",
    currency: "XOF",
    summary: "Livraison par la route depuis Conakry ou Dakar.",
    points: [
      "Pas de limite d'âge stricte selon plusieurs sources : à confirmer avant chaque vente.",
      "Les voitures à volant à droite ne sont pas immatriculables.",
      "Le transit se fait depuis Conakry ou Dakar ; le délai dépend de la route.",
    ],
    source: { label: "Policy Center, corridors des pays de l'AES", url: "https://www.policycenter.ma/publications/corridors-des-pays-de-lalliance-des-etats-du-sahel-vulnerabilites-logistiques" },
  },
  {
    slug: "cote-divoire",
    name: "Côte d'Ivoire",
    flag: "CI",
    priority: 4,
    maxAge: "5 ans",
    port: "Port d'Abidjan",
    delay: "50 à 75 jours après l'acompte",
    currency: "XOF",
    summary: "Uniquement des voitures récentes, de moins de 5 ans.",
    points: [
      "Âge maximum : 5 ans pour les voitures particulières (décret 2017-792).",
      "Une voiture trop vieille est refusée : nous ne la proposons pas.",
      "Le bordereau de suivi des cargaisons (BSC) est obligatoire.",
    ],
    source: { label: "AutoMag CI, 2025", url: "https://automag.ci/2025/08/26/import-voiture-occasion-ci-age-maximal-taxes-bonnes-pratiques-2025/" },
  },
  {
    slug: "togo-benin",
    name: "Togo et Bénin",
    flag: "TG",
    priority: 5,
    maxAge: "Togo : pas de limite · Bénin : 10 ans",
    port: "Lomé et Cotonou",
    delay: "45 à 65 jours après l'acompte",
    currency: "XOF",
    summary: "Des bateaux directs depuis la Corée jusqu'à Cotonou.",
    points: [
      "Togo : pas de limite d'âge annoncée. Bénin : 10 ans (à confirmer).",
      "Cotonou est desservi directement en bateau roulier (RoRo) depuis Pyeongtaek.",
      "Le bordereau électronique de suivi des cargaisons (BESC) est obligatoire au Bénin.",
    ],
    source: { label: "AutoMag Togo, 2025", url: "https://automag.tg/2025/11/24/importation-de-voiture-au-togo-droits-de-douane-formalites-et-conseils-pratiques/" },
  },
  {
    slug: "diaspora",
    name: "Diaspora (Belgique, France)",
    flag: "EU",
    priority: 6,
    maxAge: "Selon le pays de livraison",
    port: "Livraison à votre famille en Afrique",
    delay: "Selon le pays de livraison",
    currency: "EUR",
    summary: "Vous êtes en Europe : vous commandez, votre famille reçoit les clés.",
    points: [
      "Vous payez depuis l'Europe, par virement bancaire, à l'entreprise qui vend la voiture.",
      "La personne que vous désignez par écrit récupère la voiture, accompagnée par notre équipe.",
      "Vous suivez chaque étape sur WhatsApp, avec des photos et le suivi du bateau.",
    ],
    source: { label: "Méthode KBA", url: "/comment-acheter" },
  },
];

export const getCountry = (slug: string) => countries.find((c) => c.slug === slug);
