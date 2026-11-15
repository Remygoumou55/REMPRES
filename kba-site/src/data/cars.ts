/**
 * Catalogue des voitures.
 * ⚠️ Toutes les voitures ci-dessous sont des EXEMPLES (isExample: true) pour montrer le site.
 * Les remplacer par les vraies fiches envoyées par les parcs (voir la méthode : « dossier voiture »).
 */

export type CarStatus = "disponible" | "reservee" | "en-route" | "livree";
export type Body = "suv" | "berline" | "citadine" | "utilitaire" | "minibus" | "compacte";
export type Fuel = "Essence" | "Diesel" | "Hybride";
export type Gearbox = "Automatique" | "Manuelle";

export interface Car {
  slug: string;
  ref: string; // numéro KBA unique, suit la voiture partout
  isExample: boolean;
  status: CarStatus;
  brand: string;
  model: string;
  version: string;
  year: number;
  firstRegistration: string; // AAAA-MM
  km: number;
  fuel: Fuel;
  gearbox: Gearbox;
  engine: string;
  power: string;
  drive: string;
  seats: number;
  color: string;
  body: Body;
  location: string; // parc en Corée
  photos: string[]; // vide = photos en cours de réception
  /** Prix en dollars US. vehicle inclut le prix du parc et la commission KBA. */
  price: { vehicle: number; freight: number; insurance: number };
  /** Estimation de la douane et des frais de port en Guinée (fourchette, USD). */
  customsGN: [number, number];
  highlights: string[];
  equipment: string[];
  defects: string[];
  docs: { vin: boolean; registration: boolean; inspection: boolean; carHistory: boolean; video: boolean };
  addedAt: string; // AAAA-MM-JJ
}

export const statusLabel: Record<CarStatus, string> = {
  disponible: "Disponible en Corée",
  reservee: "Réservée",
  "en-route": "En route",
  livree: "Livrée",
};

export const bodyLabel: Record<Body, string> = {
  suv: "SUV",
  berline: "Berline",
  citadine: "Citadine",
  compacte: "Compacte",
  utilitaire: "Utilitaire",
  minibus: "Minibus",
};

const fullDocs = { vin: true, registration: true, inspection: true, carHistory: true, video: true };

export const cars: Car[] = [
  {
    slug: "toyota-corolla-hatchback-se-2019",
    ref: "KBA-0001",
    isExample: true,
    status: "disponible",
    brand: "Toyota",
    model: "Corolla Hatchback",
    version: "SE",
    year: 2019,
    firstRegistration: "2019-06",
    km: 78400,
    fuel: "Essence",
    gearbox: "Automatique",
    engine: "2.0 L Dynamic Force, 4 cylindres",
    power: "168 ch",
    drive: "Traction (2 roues motrices)",
    seats: 5,
    color: "Noir",
    body: "compacte",
    location: "Parc partenaire, Incheon",
    photos: [
      "/images/voitures/toyota-corolla-se-2019/02-arriere.jpg",
      "/images/voitures/toyota-corolla-se-2019/05-profil-droit.jpg",
      "/images/voitures/toyota-corolla-se-2019/01-arriere-3-4-droit.jpg",
      "/images/voitures/toyota-corolla-se-2019/03-arriere-3-4-gauche.jpg",
      "/images/voitures/toyota-corolla-se-2019/06-avant-droit.jpg",
      "/images/voitures/toyota-corolla-se-2019/07-vue-dessus.jpg",
    ],
    price: { vehicle: 12900, freight: 1450, insurance: 140 },
    customsGN: [3200, 4100],
    highlights: ["Boîte automatique CVT", "Environ 7 L / 100 km", "Toyota Safety Sense"],
    equipment: [
      "Freinage d'urgence automatique",
      "Maintien dans la voie",
      "Régulateur de vitesse adaptatif",
      "Écran tactile 8 pouces, Apple CarPlay",
      "Caméra de recul",
      "Phares LED",
      "Jantes alliage 16 pouces",
      "Climatisation",
    ],
    defects: ["Bas du pare-chocs avant à refixer", "Micro-rayures sur le hayon"],
    docs: fullDocs,
    addedAt: "2026-11-15",
  },
  {
    slug: "hyundai-tucson-2-0-2019",
    ref: "KBA-0002",
    isExample: true,
    status: "disponible",
    brand: "Hyundai",
    model: "Tucson",
    version: "2.0 Modern",
    year: 2019,
    firstRegistration: "2019-03",
    km: 82000,
    fuel: "Essence",
    gearbox: "Automatique",
    engine: "2.0 L, 4 cylindres",
    power: "155 ch",
    drive: "Traction (2 roues motrices)",
    seats: 5,
    color: "Blanc",
    body: "suv",
    location: "Parc partenaire, Incheon",
    photos: [],
    price: { vehicle: 13800, freight: 1550, insurance: 150 },
    customsGN: [3400, 4400],
    highlights: ["SUV familial", "Pièces faciles à trouver", "Garde au sol élevée"],
    equipment: ["Caméra de recul", "Radars de stationnement", "Écran tactile", "Climatisation automatique", "Jantes alliage 17 pouces"],
    defects: ["Rayure légère sur le pare-chocs arrière"],
    docs: fullDocs,
    addedAt: "2026-11-14",
  },
  {
    slug: "kia-sportage-2-0-2018",
    ref: "KBA-0003",
    isExample: true,
    status: "reservee",
    brand: "Kia",
    model: "Sportage",
    version: "2.0 Prestige",
    year: 2018,
    firstRegistration: "2018-09",
    km: 96500,
    fuel: "Essence",
    gearbox: "Automatique",
    engine: "2.0 L, 4 cylindres",
    power: "155 ch",
    drive: "Traction (2 roues motrices)",
    seats: 5,
    color: "Gris",
    body: "suv",
    location: "Parc partenaire, Incheon",
    photos: [],
    price: { vehicle: 12200, freight: 1550, insurance: 140 },
    customsGN: [3000, 3900],
    highlights: ["SUV compact", "Bon rapport qualité-prix", "Revente facile"],
    equipment: ["Sièges en cuir", "Caméra de recul", "Toit ouvrant", "Climatisation automatique"],
    defects: ["Usure du siège conducteur"],
    docs: fullDocs,
    addedAt: "2026-11-12",
  },
  {
    slug: "hyundai-santa-fe-2-2-diesel-2018",
    ref: "KBA-0004",
    isExample: true,
    status: "disponible",
    brand: "Hyundai",
    model: "Santa Fe",
    version: "2.2 CRDi 7 places",
    year: 2018,
    firstRegistration: "2018-05",
    km: 104000,
    fuel: "Diesel",
    gearbox: "Automatique",
    engine: "2.2 L diesel, 4 cylindres",
    power: "200 ch",
    drive: "4 roues motrices",
    seats: 7,
    color: "Noir",
    body: "suv",
    location: "Parc partenaire, Incheon",
    photos: [],
    price: { vehicle: 16900, freight: 1650, insurance: 180 },
    customsGN: [4200, 5400],
    highlights: ["7 places", "4 roues motrices", "Couple élevé pour la piste"],
    equipment: ["Sièges en cuir chauffants", "Caméra de recul", "Écran tactile", "Hayon électrique"],
    defects: ["Éclat sur le pare-brise (à remplacer)"],
    docs: fullDocs,
    addedAt: "2026-11-10",
  },
  {
    slug: "hyundai-avante-1-6-2019",
    ref: "KBA-0005",
    isExample: true,
    status: "disponible",
    brand: "Hyundai",
    model: "Avante (Elantra)",
    version: "1.6 Smart",
    year: 2019,
    firstRegistration: "2019-08",
    km: 71000,
    fuel: "Essence",
    gearbox: "Automatique",
    engine: "1.6 L, 4 cylindres",
    power: "123 ch",
    drive: "Traction (2 roues motrices)",
    seats: 5,
    color: "Argent",
    body: "berline",
    location: "Parc partenaire, Incheon",
    photos: [],
    price: { vehicle: 9300, freight: 1450, insurance: 110 },
    customsGN: [2300, 3000],
    highlights: ["Idéale taxi ou VTC", "Faible consommation", "Entretien économique"],
    equipment: ["Climatisation", "Bluetooth", "Caméra de recul", "Régulateur de vitesse"],
    defects: ["Petite bosse sur la portière arrière gauche"],
    docs: fullDocs,
    addedAt: "2026-11-09",
  },
  {
    slug: "kia-morning-picanto-2020",
    ref: "KBA-0006",
    isExample: true,
    status: "en-route",
    brand: "Kia",
    model: "Morning (Picanto)",
    version: "1.0 Luxury",
    year: 2020,
    firstRegistration: "2020-02",
    km: 48000,
    fuel: "Essence",
    gearbox: "Automatique",
    engine: "1.0 L, 3 cylindres",
    power: "76 ch",
    drive: "Traction (2 roues motrices)",
    seats: 5,
    color: "Rouge",
    body: "citadine",
    location: "Parc partenaire, Incheon",
    photos: [],
    price: { vehicle: 6900, freight: 1350, insurance: 90 },
    customsGN: [1700, 2300],
    highlights: ["Petite citadine", "Très économique", "Parfaite pour la ville"],
    equipment: ["Climatisation", "Bluetooth", "Vitres électriques"],
    defects: ["Aucun défaut visible signalé par le parc"],
    docs: fullDocs,
    addedAt: "2026-11-05",
  },
  {
    slug: "hyundai-porter-2-diesel-2017",
    ref: "KBA-0007",
    isExample: true,
    status: "disponible",
    brand: "Hyundai",
    model: "Porter II",
    version: "2.5 CRDi plateau",
    year: 2017,
    firstRegistration: "2017-11",
    km: 128000,
    fuel: "Diesel",
    gearbox: "Manuelle",
    engine: "2.5 L diesel",
    power: "133 ch",
    drive: "Propulsion",
    seats: 3,
    color: "Blanc",
    body: "utilitaire",
    location: "Parc partenaire, Incheon",
    photos: [],
    price: { vehicle: 9800, freight: 1700, insurance: 120 },
    customsGN: [2400, 3200],
    highlights: ["Charge utile environ 1 tonne", "Robuste", "Très recherché pour le commerce"],
    equipment: ["Plateau ridelles", "Climatisation", "Direction assistée"],
    defects: ["Rouille légère sur le plateau"],
    docs: fullDocs,
    addedAt: "2026-11-08",
  },
  {
    slug: "hyundai-grand-starex-12-places-2017",
    ref: "KBA-0008",
    isExample: true,
    status: "disponible",
    brand: "Hyundai",
    model: "Grand Starex",
    version: "2.5 CRDi 12 places",
    year: 2017,
    firstRegistration: "2017-07",
    km: 135000,
    fuel: "Diesel",
    gearbox: "Automatique",
    engine: "2.5 L diesel",
    power: "175 ch",
    drive: "Propulsion",
    seats: 12,
    color: "Gris",
    body: "minibus",
    location: "Parc partenaire, Incheon",
    photos: [],
    price: { vehicle: 14200, freight: 1900, insurance: 160 },
    customsGN: [3500, 4600],
    highlights: ["12 places", "Transport de personnes", "Hôtels, écoles, ONG"],
    equipment: ["Climatisation avant et arrière", "Portes coulissantes", "Caméra de recul"],
    defects: ["Usure des sièges de la 3e rangée"],
    docs: fullDocs,
    addedAt: "2026-11-07",
  },
];

export const totalPort = (c: Car) => c.price.vehicle + c.price.freight + c.price.insurance;
export const getCar = (slug: string) => cars.find((c) => c.slug === slug);
export const brands = Array.from(new Set(cars.map((c) => c.brand))).sort();
