# Prospection - Moyennes entreprises en Guinée : synthèse

Fichier de données : `moyennes.csv` (98 entreprises, séparateur `;`, UTF-8).

## 0. Limites de la collecte (à lire avant usage)

- **Le réseau de la session était restreint.** `curl` et WebFetch étaient bloqués par le proxy vers presque tous les domaines : goafricaonline.com, google.com, manjehealth.com, bcrg-guinee.org, etc. **Aucun site n'a donc pu être testé directement** (code HTTP, HTTPS, `<title>`, CMS). Les données viennent uniquement du moteur de recherche (WebSearch) : extraits d'annuaires, presse, Chambers, agrégateurs.
- Voici ce que signifient les statuts :
  - `ACTIF` : un domaine propre est cité par une source récente ou crédible. Il n'est pas vérifié techniquement (mention « non vérifié par curl » dans `qualite_site_notes`).
  - `AUCUN` : aucun site trouvé dans les sources consultées. C'est une forte présomption, pas une certitude. À confirmer par une recherche Google/Facebook manuelle avant l'appel.
  - Aucune entreprise n'est classée `FACEBOOK_SEULEMENT` ni `CASSE_OU_INJOIGNABLE`, faute de pouvoir l'observer. Les pages Facebook n'apparaissent pas dans les résultats de recherche : la colonne `reseaux_sociaux` vaut « non trouvé » partout. **Beaucoup de ces entreprises ont très probablement une page Facebook** : c'est le premier point à vérifier en phase de qualification.
- Les téléphones viennent d'annuaires (GoAfrica, liste BCRG 2018, ambassades 2018, Chambers). Ils peuvent être anciens. Rien n'a été inventé : quand une donnée manque, la colonne vaut « non trouvé ».
- Toutes les tailles sont des estimations (mention « estimation »). Quelques entités dépassent la cible des 100 employés : UKAG, Clinique Ambroise Paré, Yètè Mali. Elles sont gardées comme prospects « grands comptes ».
- **Action recommandée** : autoriser `goafricaonline.com` (et idéalement l'accès HTTP général) dans les réglages réseau de la session. On pourra alors relancer une passe de vérification `curl` sur les 12 sites `ACTIF` et compléter les téléphones à partir des fiches GoAfrica.

## 1. Secteurs couverts (98 entreprises)

| Secteur | Nb | Exemples |
|---|---|---|
| Santé (cliniques, pharmacies, grossistes) | 14 | Clinique Pasteur, CIBA, Ambroise Paré, UbiPharm, Laborex, Sodipharm |
| Hôtellerie / restauration | 10 | Hôtel Kaloum, Mariador Palace, Palm Camayenne, Riviera Taouyah, Hotel Azur |
| Logistique / transit / transport | 9 | Nicotram, Africa Transport SA, NABAYA, Bamsco |
| Éducation (universités, écoles) | 8 | UKAG, Université Nongo Conakry, La Source, Keyce, ISIIG |
| Cabinets (avocats, audit, comptabilité) | 8 | Thiam & Associés, Sylla & Partners, Fiduxis, Epsilone, ICARUS Legal |
| BTP | 6 | ACTEG Construction, Africa-Germany SA, SOCOF, Origo-Africa |
| Imprimeries | 6 | Les Éléphants de l'Imprimerie, Centama, FIDEC, Dialima |
| IT / informatique | 6 | Uptime, SOCITECH, A&T Ingénierie (Dell), INFOTEC |
| Communication (concurrents/partenaires) | 5 | Afridigicom, Jelani Digital, Galaxie Marketing |
| Immobilier | 5 | MK Habitat, B2D Immobilier, Aguimmo, DIMAB |
| Microfinance | 4 | Yètè Mali, Finadev, Cofina, Wakili |
| Automobile / engins | 4 | Seta Motors (Mitsubishi/Renault/Kia), Groupe SCF (Nissan), TCG |
| Agroalimentaire | 4 | SOGUIPAL, CCG SARL, Entrael, GeniMeal |
| Tourisme / agences de voyage | 3 | Mondial Express, MAME Voyage SARL, Guinée Voyages |
| Distribution / import-export | 3 | Diaouné et Frères (Sumol/Compal), EJ-Distribution, Worobe |
| Auto-écoles | 2 | Auto École Debo (multi-agences), Noblesse |
| Sécurité privée | 1 | Krypta Africa Sécurité (KAS) SARL |

## 2. Maturité web observée

- **12 sur 98 (12 %)** ont un domaine propre cité : UKAG, Keyce, Université Nongo Conakry, Université La Source, Fiduxis, Thiam & Associés, Sylla & Partners, ACTEG, Mariador Palace, et trois agences de communication.
- **86 sur 98 (88 %)** n'ont aucun site trouvé. Leur seule présence en ligne est une fiche d'annuaire (GoAfrica), une OTA (Booking, Expedia) ou un article de presse.
- Quelques signaux faibles reviennent souvent :
  - **Emails Gmail** au lieu d'emails professionnels (Hôtel Kaloum : hotelkaloum@gmail.com).
  - **Domaine email sans site** : cliniquepasteurguinee.com, ciba-rivier.com, cliniqueambroise.com. Le nom de domaine existe déjà mais aucun site n'est indexé : c'est la vente la plus facile.
  - **Plusieurs domaines dispersés** pour une même entité (UKAG : univ-kag.education, univ-kag.org, ukaguinee.org). Argument pour une refonte et une unification.
  - Les hôtels dépendent des OTA (commission de 15 à 25 %) et n'ont pas de réservation directe.
- La concurrence locale existe et produit du contenu SEO agressif. Par exemple, l'agence Kolonell publie des dizaines d'articles « site web + secteur + Conakry 2026 ». Le marché est donc éduqué, mais il faut se différencier.

## 3. Top 10 des prospects prioritaires

| # | Entreprise | Pourquoi |
|---|---|---|
| 1 | **Clinique Pasteur** (Kaloum) | Clinique établie (1987), 24h/24, un domaine email existe mais aucun site trouvé. Besoin : prise de RDV, services, urgences. |
| 2 | **CIBA - Clinique Internationale Bel'Air** (Matam) | Large gamme de services (imagerie, labo, médecine du travail), domaine ciba-rivier.com sans site indexé. Elle vise aussi les entreprises (visites médicales). |
| 3 | **Hôtel Kaloum** (Kaloum) | Hôtel d'affaires, email Gmail, dépendant des OTA. Gain immédiat : réservation directe et emails professionnels. |
| 4 | **MK Habitat** (Nongo Taady) | Agence immobilière récemment médiatisée (AllAfrica, mai 2026), sans site. Le catalogue de biens avec admin est le cœur de notre offre. |
| 5 | **B2D Immobilier** | Promoteur très actif (contrat TotalEnergies 2026, partenariat Ecobank), sans site trouvé. Il lui faut une vitrine de programmes et des formulaires de réservation. |
| 6 | **Seta Motors** | Représentant de Mitsubishi, Renault et Kia, sans catalogue en ligne. Besoin : catalogue de véhicules avec admin, demandes d'essai et de devis. |
| 7 | **Auto École Debo** | Réseau de 5 agences ou plus. Besoin : inscription en ligne, choix d'agence, suivi des candidats dans l'espace admin. |
| 8 | **Krypta Africa Sécurité (KAS) SARL** | Secteur qui répond aux appels d'offres d'ONG et de l'ONU (Plan International, UNICEF). Un site crédible avec références et agréments aide à être présélectionné. |
| 9 | **SOGUIPAL** (Coyah) | Industriel en croissance (extension d'usine financée), avec des marques de jus et de yaourts. Besoin : vitrine produits et espace distributeurs. |
| 10 | **ICARUS Legal** | Cabinet d'affaires créé en 2024, sans site, avec des clients internationaux (mines, énergie). Besoin : site bilingue FR/EN haut de gamme. |

Les suivants : Diaouné et Frères (distributeur Sumol/Compal), Groupe SCF (Nissan), Yètè Mali et Finadev (simulateur de crédit), Mondial Express (visas et formations), Université Mahatma Gandhi (aucun site).

## 4. Arguments de vente adaptés

- **Général** : « Vos clients vous cherchent sur Google et ne trouvent qu'une fiche d'annuaire, ou votre concurrent. » Le site est hébergé sur Cloudflare : rapide, sécurisé (HTTPS), avec très peu de pannes, et il tient même avec une connexion mobile lente. L'espace admin permet de mettre à jour le contenu soi-même, sans dépendre d'un prestataire.
- **Emails professionnels** (contact@entreprise.gn ou .com) à la place de Gmail : crédibilité auprès des banques, des ONG et des miniers.
- **Santé** : prise de rendez-vous en ligne, liste des spécialités et des médecins, numéros d'urgence visibles, offre « médecine du travail » pour les entreprises.
- **Hôtels** : réservation directe sans commission OTA. Une seule réservation directe par semaine rembourse le site en quelques mois.
- **Immobilier et automobile** : catalogue filtrable géré depuis l'admin, partage WhatsApp de chaque bien ou véhicule.
- **Cabinets (avocats, audit)** : site bilingue FR/EN pour les investisseurs étrangers et le secteur minier (Simandou), pages d'expertise, publications. Le guide de l'investisseur de Thiam & Associés est un bon modèle.
- **Sécurité, BTP, transit** : page de références chantiers ou clients, agréments (ORASPC, CAD douane), documents téléchargeables pour les dossiers d'appel d'offres.
- **Microfinance** : simulateur de crédit, liste des agences, formulaire de pré-demande, transparence réglementaire (BCRG).
- **Éducation** : préinscriptions en ligne, publication des résultats et des actualités, espace parents ou étudiants.

## 5. Type de site à proposer par secteur

| Secteur | Type de site | Modules admin clés |
|---|---|---|
| Cliniques | Vitrine et prise de RDV | Médecins, spécialités, créneaux, demandes de RDV |
| Pharmacies / grossistes | Vitrine et catalogue / commande B2B | Produits, commandes des officines, upload d'ordonnances |
| Hôtels / restaurants | Vitrine et réservation directe | Chambres, tarifs, disponibilités, menus |
| Universités / écoles | Portail institutionnel | Actualités, filières, préinscriptions, résultats |
| Immobilier | Catalogue de biens | Biens (photos, prix, quartier), leads |
| Concessionnaires | Catalogue de véhicules | Véhicules, demandes d'essai et de devis |
| Cabinets | Vitrine corporate bilingue | Publications, équipe, expertises |
| BTP / sécurité / transit | Vitrine corporate et références | Projets ou chantiers, documents AO, recrutement |
| Microfinance | Vitrine et simulateur | Produits de crédit, agences, pré-demandes |
| Agroalimentaire / distribution | Vitrine produits et espace revendeurs | Produits, points de vente, commandes revendeurs |
| Auto-écoles | Vitrine et inscription | Agences, formules, inscriptions, planning |
| Imprimeries | Vitrine et devis en ligne | Produits, demandes de devis avec fichiers |

## 6. Fourchettes de prix envisageables (GNF)

Repère marché : un concurrent local (blog Kolonell, 2026, source promotionnelle) annonce 6 M GNF pour un site de 5 pages et 10 à 20 M GNF pour un site de 10 à 15 pages. Les agences locales vont de 20 à 60 M GNF sur les projets plus lourds.

| Offre | Contenu | Prix indicatif |
|---|---|---|
| **Essentiel** | Vitrine 5 pages, admin simple, HTTPS Cloudflare, 2-3 emails pro | 4 à 7 M GNF |
| **Pro** | 8 à 15 pages, admin complet (actualités, galerie, formulaires), FR/EN en option | 8 à 15 M GNF |
| **Métier** | Catalogue, réservation, prise de RDV ou préinscriptions | 15 à 30 M GNF |
| **Grand compte** | Portail (université, clinique de référence, IMF avec simulateur), multilingue | 30 à 50 M GNF ou plus |
| **Maintenance / hébergement** | Domaine, Cloudflare, sauvegardes, petites évolutions | 300 000 à 1 M GNF par mois (ou 3 à 8 M GNF par an) |

Conseil : proposer un paiement en 2 ou 3 tranches (40 % à la commande, 40 % à la mise en ligne, 20 % à 30 jours). Mettre en avant l'abonnement de maintenance, qui crée un revenu récurrent.
