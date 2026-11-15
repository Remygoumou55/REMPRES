/** Guides (blog). Chaque article est une suite de blocs simples. */
export type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

export interface Guide {
  slug: string;
  title: string;
  excerpt: string;
  category: "Guide d'achat" | "Pays" | "Confiance et sécurité" | "Modèles";
  country?: string;
  date: string; // AAAA-MM-JJ
  readingMinutes: number;
  body: Block[];
}

export const guides: Guide[] = [
  {
    slug: "importer-voiture-coreenne-guinee-2026",
    title: "Importer une voiture coréenne en Guinée en 2026 : le guide simple",
    excerpt: "Âge maximum, documents, délais, douane : tout ce qu'il faut savoir avant de commander une voiture en Corée pour Conakry.",
    category: "Pays",
    country: "Guinée",
    date: "2026-11-15",
    readingMinutes: 6,
    body: [
      { type: "p", text: "Acheter une voiture en Corée du Sud pour la faire venir à Conakry, c'est possible et c'est souvent intéressant : les voitures coréennes sont bien entretenues, elles ont le volant à gauche et leurs pièces se trouvent facilement. Mais il faut connaître quelques règles pour éviter les mauvaises surprises." },
      { type: "h2", text: "1. La voiture doit avoir 13 ans maximum" },
      { type: "p", text: "Depuis juillet 2021, la Guinée interdit l'importation des voitures de plus de 13 ans, comptés depuis leur première mise en circulation. Regardez donc la date de première immatriculation sur la carte grise coréenne, pas seulement l'année du modèle." },
      { type: "h2", text: "2. Le volant à droite est interdit" },
      { type: "p", text: "Les voitures à volant à droite (beaucoup de voitures japonaises) ne peuvent pas être immatriculées en Guinée. Les voitures coréennes ont toutes le volant à gauche : pas de problème de ce côté." },
      { type: "h2", text: "3. Les documents à exiger" },
      { type: "ul", items: ["La carte grise coréenne (자동차등록증) avec le numéro de châssis (VIN).", "Le rapport d'inspection coréen (성능·상태점검기록부).", "L'historique d'accidents CarHistory (카히스토리).", "Le certificat de radiation pour export, qui porte le même VIN.", "Le connaissement (B/L) à votre nom.", "La facture commerciale à votre nom."] },
      { type: "h2", text: "4. Combien de temps ça prend" },
      { type: "p", text: "Comptez en général 45 à 70 jours entre la commande et la remise des clés : préparation et papiers d'export en Corée, attente du bateau, environ 5 à 7 semaines de mer avec transbordement, puis le dédouanement à Conakry." },
      { type: "h2", text: "5. La douane" },
      { type: "p", text: "Les droits et taxes dépendent de la valeur, de l'âge et du type de voiture. Demandez toujours une estimation écrite à un transitaire agréé avant de commander, et payez la douane directement au transitaire, contre un reçu officiel. Les formalités passent par le guichet unique GUCEG." },
      { type: "h2", text: "Notre conseil" },
      { type: "p", text: "Ne payez jamais une voiture dont vous n'avez pas reçu le numéro de châssis et une vidéo à votre nom. Et payez toujours une entreprise, jamais une personne." },
    ],
  },
  {
    slug: "verifier-vendeur-voiture-coree",
    title: "Comment vérifier un vendeur de voitures en Corée avant de payer",
    excerpt: "Six vérifications simples, à faire vous-même en moins de 30 minutes, pour éviter les fausses pages et les faux exportateurs.",
    category: "Confiance et sécurité",
    date: "2026-11-15",
    readingMinutes: 5,
    body: [
      { type: "p", text: "Les arnaques à la voiture importée suivent presque toujours le même schéma : une belle page Facebook, des photos volées, un acompte demandé vite, puis plus rien. La bonne nouvelle : quelques vérifications simples suffisent à les éviter." },
      { type: "h2", text: "1. Demandez le numéro d'entreprise coréen" },
      { type: "p", text: "Une entreprise coréenne a un numéro d'enregistrement à 10 chiffres. Il se vérifie gratuitement sur HomeTax, le site officiel des impôts coréens : l'entreprise doit être active." },
      { type: "h2", text: "2. Exigez le numéro de châssis avant de payer" },
      { type: "p", text: "Le VIN est la carte d'identité de la voiture. Il doit être le même sur tous les documents. Un vendeur qui refuse de le donner avant le paiement cache quelque chose." },
      { type: "h2", text: "3. Demandez une vidéo à votre nom" },
      { type: "p", text: "Une vidéo de la voiture avec une feuille portant votre nom et la date du jour prouve que la voiture existe vraiment et que le vendeur l'a sous la main." },
      { type: "h2", text: "4. Payez une entreprise, jamais une personne" },
      { type: "p", text: "Le compte bancaire doit être au nom exact de l'entreprise inscrite sur la facture. Refusez Western Union et les comptes personnels pour le prix d'une voiture." },
      { type: "h2", text: "5. Vérifiez le B/L vous-même" },
      { type: "p", text: "Le connaissement prouve que la voiture est sur le bateau. Vérifiez-le sur le site officiel de la compagnie maritime, en tapant vous-même l'adresse, pas sur un lien envoyé par le vendeur." },
      { type: "h2", text: "6. Méfiez-vous de la pression" },
      { type: "ul", items: ["« Payez aujourd'hui, un autre client attend. »", "Un prix très en dessous du marché.", "Un numéro de compte qui change en cours de route.", "Un refus d'appel vidéo."] },
      { type: "p", text: "Un seul de ces signaux suffit pour arrêter et vérifier." },
    ],
  },
];

export const getGuide = (slug: string) => guides.find((g) => g.slug === slug);
