# Rapport global de prospection : entreprises en Guinée

**Date :** 20 novembre 2026
**Objectif :** trouver les entreprises à qui vendre un site web professionnel (avec espace de gestion, hébergé sur Cloudflare), puis les classer par priorité, urgence, rentabilité, impact et besoin, pour produire 10 sites par jour.

---

## 0. À lire avant tout (limites)

1. **317 entreprises réelles recensées** après dédoublonnage (objectif : 200). Chaque ligne cite sa source (URL). **Aucune coordonnée n'a été inventée** : si une information est introuvable, c'est écrit « non trouvé ».
2. **Les sites n'ont pas pu être ouverts.** Le réseau de cet environnement bloque les connexions directes vers les sites web : seule la recherche web marchait. Résultat :
   - « ACTIF » veut dire que le site existe d'après les moteurs de recherche ou les annuaires. Je n'ai **pas** pu juger son design, sa vitesse ou sa version mobile. **Ouvre chaque lien toi-même** avant de démarcher.
   - « Sans site » veut dire qu'aucun site n'a été trouvé dans les sources. Cela reste à confirmer par une recherche Google rapide (2 minutes) avant d'appeler, surtout pour les grandes entreprises. Par exemple, BICIGUI ou WCS ont peut-être un site que la recherche n'a pas remonté.
3. **Les téléphones viennent d'annuaires et de pages Facebook**, parfois anciens (certains datent de 2018). Aucun n'a été appelé.
4. **Les tailles d'entreprise (petite, moyenne, grande) sont des estimations.**

> Pour aller plus loin, il faudrait autoriser `goafricaonline.com` et l'accès web général dans les réglages réseau de l'environnement. On pourrait alors tester chaque site automatiquement (HTTPS, vitesse, mobile) et récupérer des centaines de fiches de plus : GoAfrica liste à elle seule 369 restaurants et 288 salons de coiffure à Conakry.

---

## 1. Les fichiers livrés

| Fichier | Contenu |
|---|---|
| `RAPPORT_GLOBAL.md` (ce fichier) | Synthèse, plan d'attaque, top 10 de demain, arguments, prix |
| `LISTE_COMPLETE.md` | Les 317 entreprises classées par catégorie, puis sans site / avec site (avec les liens), triées par score |
| `entreprises_guinee_consolide.csv` | Le même contenu en tableur (ouvrable dans Excel), avec toutes les colonnes et les 5 sous-scores |
| `brut/` | Les fichiers des 3 agents et leurs notes détaillées par catégorie |
| `scripts/prospection/` | Les scripts qui calculent le score et regénèrent les listes |

---

## 2. Vue d'ensemble

| Catégorie | Total | Sans site web | Avec site web | Ce qu'on vend |
|---|---|---|---|---|
| **Petites entreprises** | 140 | **127** (98 n'ont que Facebook ou Instagram, 29 n'ont rien) | 13 | Création rapide : vitrine, menu, commande WhatsApp, prise de rendez-vous |
| **Moyennes entreprises** | 94 | **82** | 12 | Création « métier » : rendez-vous, réservation, catalogue, préinscription |
| **Grandes entreprises** | 83 | **48** | 35 | Gros contrats, cycle de vente long, souvent par appel d'offres |
| **Total** | **317** | **257 (81 %)** | **60** | |

**Les grandes leçons :**
- **8 entreprises sur 10 n'ont pas de site.** Le marché est presque vierge.
- **Les petites entreprises vivent sur Facebook et WhatsApp.** Leur catalogue se perd dans les publications, elles ne sont pas trouvables sur Google, et elles répondent aux mêmes questions toute la journée (prix, horaires, localisation).
- **Les moyennes entreprises sont le meilleur rapport gain / effort**, surtout les cliniques, les hôtels, l'immobilier et la microfinance. Elles ont le budget, un vrai besoin, et la décision se prend vite (le patron décide seul). Signe très fréquent : un email Gmail, ou un nom de domaine qui existe pour l'email mais sans site derrière.
- **Pour les grandes entreprises, les filiales de groupes internationaux sont à oublier** (Ecobank, UBA, Orange, TotalEnergies, Radisson…) : leur site est géré par le siège à l'étranger. Les bonnes cibles sont les sociétés guinéennes et publiques **en transition** (nationalisation, rachat, nouveau statut) et les champions nationaux absents du web.
- **La concurrence existe** (par exemple l'agence Kolonell, qui publie ses prix : environ 6 M GNF pour 5 pages). Il faut donc se différencier par la vitesse de livraison, l'espace de gestion inclus et l'hébergement Cloudflare.

---

## 3. Méthode de classement (score sur 100)

Chaque entreprise a un score calculé automatiquement (colonnes `score_*` du CSV) :

| Critère | Poids | Logique |
|---|---|---|
| **Besoin** | 25 % | Pas de site, ou seulement Facebook = 5. Site existant mais daté (HTTP seul, PDF, WordPress ancien) = 3. Site récent = 2 |
| **Rentabilité** | 25 % | Grande = 5, moyenne = 3, petite = 2, avec +1 pour les secteurs qui paient bien (santé, immobilier, hôtellerie, éducation, automobile, finance, cabinets, BTP, logistique) |
| **Chance d'acceptation** | 20 % | Petites et moyennes = 4, grandes = 3, −1 si public (procédure lourde), −2 si filiale d'un groupe international |
| **Joignabilité** | 15 % | Téléphone et email trouvés = 5, téléphone seul = 4, email seul = 3, réseau social seul = 2, rien = 1 |
| **Urgence** | 15 % | 5 si un événement rend le site urgent (ouverture, rachat, nationalisation, relance, email Gmail) ou si un agent l'a signalée comme prioritaire, 4 si un signal faible, sinon 3 |

Le score sert à trier. Le **top 10 de demain** (section 4) a été choisi à la main parmi les meilleurs scores, en ajoutant un critère pratique : **pouvoir livrer en une journée** et **pouvoir joindre l'entreprise par téléphone dès demain matin.**

---

## 4. LE PLAN DE DEMAIN : les 10 premiers sites à faire

Choix : un mélange de **moyennes entreprises à fort budget** (pour l'argent) et de **petites entreprises faciles à convaincre** (pour la vitesse et les références). Toutes ont un téléphone trouvé.

**Conseil clé : construis la maquette AVANT d'appeler.** Prends le logo et les photos de leur page Facebook, monte une première version du site sur Cloudflare, puis montre-la. Une entreprise qui voit déjà « son » site en ligne dit oui beaucoup plus facilement.

| # | Entreprise | Catégorie | Contact | Pourquoi elle | Site à proposer | Argument choc | Prix indicatif |
|---|---|---|---|---|---|---|---|
| 1 | **Clinique Pasteur** (Kaloum, depuis 1987, 24h/24) | Moyenne | +224 621 35 01 01 / +224 664 26 98 53, contact@cliniquepasteurguinee.com | ⚠️ **Mise à jour du 20/11 :** la recherche détaillée a montré qu'elle a **déjà un site** (WordPress, septembre 2025, agence Rarili), mais rempli d'erreurs graves. C'est donc une **refonte**, pas une création. Voir `clients/clinique-pasteur/` | Refonte premium FR/EN : urgences 24/7, page IME, entreprises et assurances, médecins, rendez-vous | « Votre bouton d'appel compose un faux numéro américain. » | 20 à 35 M GNF |
| 2 | **CIBA – Clinique Internationale Bel'Air** (Matam) | Moyenne | +224 622 93 86 75, ciba@ciba-rivier.com | ⚠️ **Mise à jour du 20/11 :** un site existe (https://www.ciba-rivier.com/) mais il est abandonné depuis 2020, avec un faux bouton de rendez-vous. C'est donc une **refonte**. Elle vise les entreprises avec la médecine du travail | Vitrine + rendez-vous + **page « Entreprises : visites médicales »** avec formulaire de devis | « Les DRH des mines et ONG choisissent la clinique qu'ils trouvent en ligne. » | 15 à 25 M GNF |
| 3 | **Hôtel Kaloum** (Avenue de la République) | Moyenne | 656 22 02 22 (numéro de 2018 à confirmer), hotelkaloum@gmail.com | Hôtel d'affaires avec une adresse Gmail, qui dépend de Booking (15 à 25 % de commission) | Site + chambres + **réservation directe** + emails pro | « Une seule réservation directe par semaine rembourse le site en quelques mois. » | 12 à 20 M GNF |
| 4 | **Clinique Dentaire OSD** (Concasseur, T1) | Petite | +224 610 51 79 33, Facebook CDBTM | La santé paie mieux, un site rassure les patients | Vitrine + soins et tarifs + **rendez-vous en ligne** | « Vos patients prennent rendez-vous à 22 h sur leur téléphone. » | 3,5 à 6 M GNF |
| 5 | **Afric-immo** (Sonfonia) | Petite | +224 629 14 59 44, Afric.immo224@gmail.com | Publie beaucoup d'annonces sur Facebook, déjà joignable par email | **Catalogue de biens avec filtres** (quartier, prix) + espace admin pour publier | « Vos annonces Facebook disparaissent en 2 jours. Sur votre site, elles restent et se partagent en un lien WhatsApp. » | 5 à 9 M GNF + maintenance |
| 6 | **Aguimmo** (Camayenne) | Petite | +224 610 89 89 89 | Vente, location, construction et gestion : produit idéal pour un abonnement mensuel | Catalogue immobilier + espace admin + page promotion | Idem, plus : « un vrai site rassure la diaspora qui achète depuis l'étranger. » | 6 à 9 M GNF |
| 7 | **Auto École Prestige** (en face d'Amore Mio) | Petite | +224 623 46 23 49 | Se présente comme « 100 % VIP » mais n'a que Facebook : incohérent avec son image | Vitrine + formules et tarifs + **inscription en ligne** | « Une marque VIP sans site, ça ne fait pas VIP. » | 3 à 5 M GNF |
| 8 | **Africa Digitale Académie** (Dixinn) | Petite | +224 627 59 35 35 | Une académie du numérique sans site : l'argument est évident | Catalogue de formations + calendrier + **inscription et paiement Orange Money** | « Vous enseignez le numérique : votre site est votre carte de visite. » | 4 à 7 M GNF |
| 9 | **GAG – Guinéenne d'Automobile Garage** (Kipé) | Petite | +224 627 46 76 76 / +224 620 13 38 16 | Se présente comme une « clinique automobile » moderne | Vitrine + services + **prise de rendez-vous** pour l'entretien | « Les flottes d'entreprises cherchent un garage sérieux sur Google. » | 3 à 5 M GNF |
| 10 | **Hello Eats** (Ratoma) | Petite | +224 629 54 36 36 | Livre déjà des repas et prend les commandes par WhatsApp : le site augmente directement ses ventes | **Menu en ligne + panier qui envoie la commande sur WhatsApp** + zones de livraison | « Moins de messages à gérer, plus de commandes, panier moyen plus élevé. » | 3 à 5 M GNF |

**Remplaçants** (si une des dix ne répond pas) : Coco Restaurant (Kaloum, +224 613 56 38 27, en préparation d'ouverture : c'est le moment idéal), Rianne Cosmétiques (+224 620 26 79 63), Clinique Dienaba Kassé (+224 622 97 68 42), Afrik Link Clinique (+224 621 74 64 99), Clinique Intermedic (+224 656 73 62 71), Bah'Auto-224GN (+224 621 94 92 16), E-Food (+224 624 32 99 75).

**Potentiel du jour 1 :** environ **70 à 120 M GNF** si les dix signent, plus la maintenance mensuelle.

---

## 5. Classement par catégorie : qui attaquer, avec quoi

### 5.1 Petites entreprises (140)

**Sans site (127) : la cible principale, en volume.** Les secteurs, du plus prioritaire au moins prioritaire :

1. **Santé dentaire et cabinets médicaux** : rentables et soucieux de leur image. Pack Rendez-vous.
2. **Immobilier** (Afric-immo, Aguimmo, Agent Immobilier…) : catalogue plus abonnement mensuel, donc revenu récurrent. Pack Catalogue.
3. **Auto-écoles** (Prestige, MAD, AMSY…) et **garages** : tarifs plus inscription. Pack Rendez-vous ou Formation.
4. **Restaurants, livraison, pâtisseries** (Hello Eats, Coco, E-Food, Hasfaby…) : menu plus commande WhatsApp. Gain immédiat et visible.
5. **Centres de formation** : catalogue plus inscription.
6. **Beauté, coiffure, mode, couture, photographes** : vitrine, galerie ou portfolio plus WhatsApp. Petits budgets, mais livraison très rapide : bon pour gonfler le nombre de références.

**Avec site (13) : ouvre chaque lien et regarde s'il est lent, pas adapté au mobile ou pas à jour.**

| Entreprise | Lien | À regarder |
|---|---|---|
| Waraba Fitness Club (≈22 000 abonnés) | http://www.warabafitness.com/ | Le lien est en HTTP (non sécurisé ?). Proposer une refonte avec abonnement en ligne. **La plus prometteuse de la liste.** |
| Groupe Mondial Tours | https://groupemondialtours.com/ | Agence de voyage : réservation, visas |
| Anata Voyage | https://anatavoyage.com/ | Idem |
| Auto-école SAFABHE | https://www.safabhe.com/auto-ecole/ | Simple page dans un site plus large : proposer un site dédié |
| Dentistes du Sud (Sonfonia) | https://dentistesdusud.org/ | Ajouter la prise de rendez-vous |
| AF Location / Wedrive Africa | https://www.aflocation.com / https://www.wedrive.africa/ | Location de voitures : vérifier le système de réservation |
| Cré'Art | https://cre-art-gn.com/ | Portfolio |
| Omakiti, ECOM Guinée, Afri-Store, Margaarou, Arabinènè | voir `LISTE_COMPLETE.md` | Déjà des e-commerces : peu prioritaires. Leur proposer plutôt de la maintenance, de la vitesse ou l'hébergement Cloudflare |

### 5.2 Moyennes entreprises (94) : le cœur de la rentabilité

**Sans site (82), ordre d'attaque :**

1. **Cliniques** : Clinique Pasteur, CIBA, Dienaba Kassé, Afrik Link, Intermedic. Score de 82 à 91. Rendez-vous en ligne, médecine du travail.
2. **Hôtels** : Hôtel Kaloum (et Riviera Taouyah, classé en grande entreprise). Réservation directe sans commission Booking.
3. **Microfinance** : Yètè Mali, Finadev, Cofina. Simulateur de crédit, liste des agences, pré-demande en ligne. Budgets réels, mais les téléphones datent de 2018 (liste BCRG) : passer par l'accueil.
4. **Immobilier et promotion** : MK Habitat (vu dans la presse en mai 2026), B2D Immobilier (contrat TotalEnergies 2026). Catalogue de programmes immobiliers.
5. **Automobile** : Seta Motors (Mitsubishi, Renault, Kia), Groupe SCF (Nissan). Catalogue de véhicules et demande d'essai.
6. **Auto École Debo** (5 agences ou plus) : inscription avec choix de l'agence.
7. **Cabinets d'avocats** (ICARUS Legal, créé en 2024, clients miniers) : site bilingue français-anglais haut de gamme.
8. **Sécurité** (Krypta Africa Sécurité) : références et agréments pour les appels d'offres des ONG et de l'ONU.
9. **Agroalimentaire** (SOGUIPAL : jus et yaourts, usine agrandie) : vitrine des produits et espace revendeurs.
10. **Logistique et transit** (Africa Transport SA, Nicotram…) et **imprimeries** (Centama…) : vitrine, devis en ligne.

> Pour MK Habitat, B2D, Seta Motors, ICARUS et Debo, aucun téléphone n'a été trouvé. Passe par leur page Facebook ou LinkedIn, ou va directement sur place.

**Avec site (12) : à auditer pour une refonte.**

| Entreprise | Lien | Opportunité |
|---|---|---|
| Université Kofi Annan (UKAG) | www.ukaguinee.org (anciens : univ-kag.education, univ-kag.org) | **Trois domaines différents pour la même université** : proposer un portail unique avec préinscriptions et résultats. Gros contrat. |
| Mariador Palace | www.hotelsmariador.com | Site probablement ancien (ex-Le Méridien) : proposer la réservation directe |
| ACTEG Construction | acteg.org | Ajouter les références de chantiers et un espace pour les appels d'offres |
| Fiduxis | www.fiduxis.com | Recrute beaucoup en 2026 : page carrières |
| Université Nongo Conakry, Université La Source | uncgn.com, www.universitelasource.org | Portail étudiant |
| Thiam & Associés, Sylla & Partners | thiam-associes.com, syllapartners.com | Probablement corrects : proposer seulement la maintenance |
| Keyce | conakry.keyce.education | Site du groupe : faible chance |
| Visicom, Afridigicom, Jelani Digital | | **Concurrents.** Partenariat ou sous-traitance possible, pas des clients |

### 5.3 Grandes entreprises (83) : gros chèques, cycle long

On ne les signe pas en un jour. **Il faut ouvrir les dossiers dès cette semaine** : envoyer un audit gratuit et une maquette, puis relancer. Pour les sociétés publiques, préparer le dossier administratif (attestations fiscales et sociales, références). **Les trois sites livrés cette semaine servent de références.**

**Sans site, les plus prioritaires :**

| # | Entreprise | Pourquoi maintenant | Contact trouvé |
|---|---|---|---|
| 1 | **Areeba Guinée** (ex-MTN, nationalisée en décembre 2025) | Nouvelle identité obligatoire, hors marque MTN | non trouvé |
| 2 | **SOGEAG SA** (aéroports) | Nouveau statut en 2025 : infos vols, services, appels d'offres | non trouvé |
| 3 | **Ciments de Guinée** | Racheté par Hillside en 2025, aucun site trouvé | non trouvé |
| 4 | **Vista Bank Guinée** | Banque sans site local trouvé | +224 662 46 46 46, info@vistabankgroup.com |
| 5 | **BICIGUI** | Grande banque sans site trouvé (à confirmer) | +224 621 07 86 12 |
| 6 | **Activa Vie Guinée** | Assureur sans site local | +224 622 35 35 66 |
| 7 | **Groupe GUITER** (premier BTP guinéen) | Absent du web alors qu'il vise les appels d'offres internationaux (Simandou) | non trouvé |
| 8 | **Groupe CIAO, SONOCO, SNC** (agro-industrie) | En croissance, sans catalogue de produits en ligne | non trouvé |
| 9 | **Guinée Télécom, CNSS, LONAGUI, Port Autonome** | Sociétés publiques peu ou pas présentes en ligne | non trouvé (passer par les marchés publics) |
| 10 | **Imperial Corporation** (Carrefour) | Proposer le e-commerce ou le drive | non trouvé |

**Avec site, les refontes à fort potentiel** (liste complète dans `LISTE_COMPLETE.md`) :
- **SGBG** (https://www.sgbg.net.gn) : changement d'actionnaire en 2025, donc rebranding obligatoire.
- **Palm Camayenne** (http://palmcamayenne.com) et **Riviera Royal** (http://rivieraroyalhotel.com) : hôtels indépendants avec des liens en HTTP, donc sites probablement datés. Ce sont **les meilleures refontes de la catégorie** : décision rapide, réservation directe.
- **UGAR Activa** (http://www.ugar.com.gn), **SEG** (http://www.segguinee.com), **ARPT** (http://www.arpt.gov.gn) : liens en HTTP, à moderniser.
- **Clinique Ambroise Paré** (http://www.cliniqueambroisepare.com) : rendez-vous en ligne.
- **EDG, SMB** : sites WordPress remplis de PDF. Proposer la maintenance, la sécurité et un vrai espace appels d'offres.
- **À ignorer** : Ecobank, UBA, Orange, Orabank, Afriland, SUNU, TotalEnergies, Radisson, Onomo, Noom, MSC, AGL, AngloGold, Rio Tinto, Sogea-Satom. Leur site est géré par le groupe à l'étranger.

---

## 6. Arguments de vente qui marchent

- **« Facebook ne vous appartient pas »** : une page peut être piratée, suspendue ou cachée par l'algorithme. Le site avec votre nom de domaine reste à vous.
- **« Vos clients vous cherchent sur Google »** : en tapant « clinique Kaloum » ou « auto-école Conakry », ils trouvent vos concurrents.
- **L'espace de gestion inclus** : vous ajoutez vous-même un produit, un bien, une actualité ou une offre d'emploi depuis votre téléphone. Vous ne dépendez pas d'un informaticien.
- **Cloudflare** : site rapide même en 3G, sécurisé (HTTPS), protégé contre les attaques, presque jamais en panne.
- **Emails professionnels** (contact@votre-entreprise.com à la place de Gmail) : plus crédible auprès des banques, des ONG, des miniers et de la diaspora.
- **Paiement local** : bouton WhatsApp, Orange Money ou MTN MoMo.
- **Pour les grandes entreprises** : site bilingue français-anglais, pages carrières et appels d'offres (moins d'annonces payées dans la presse), documents RSE et ITIE, statistiques mensuelles pour la direction.
- **Le bon moment** : ouverture, rachat, nationalisation, nouveau statut. C'est l'argument d'urgence.

---

## 7. Grille de prix conseillée (GNF)

Repère : 1 EUR ≈ 9 500 à 10 000 GNF. Le concurrent Kolonell annonce environ 6 M GNF pour 5 pages et 10 à 20 M GNF pour 10 à 15 pages.

| Offre | Pour qui | Prix de création | Récurrent |
|---|---|---|---|
| Pack Vitrine WhatsApp (1 à 3 pages) | Coiffure, couture, photographes, garages | 1,5 à 3 M | Domaine et hébergement : 400 000 à 700 000 par an |
| Pack Menu et Commande | Restaurants, pâtisseries, cosmétiques | 3 à 5 M | 150 000 à 300 000 par mois |
| Pack Rendez-vous | Dentistes, garages, salons, auto-écoles | 3,5 à 6 M | 200 000 à 350 000 par mois |
| Pack Catalogue (immobilier, automobile) | Agences, concessionnaires | 5 à 9 M | 250 000 à 500 000 par mois |
| Site Pro, moyenne entreprise (8 à 15 pages) | Cabinets, BTP, logistique | 8 à 15 M | 300 000 à 1 M par mois |
| Site métier (rendez-vous, réservation, préinscription) | Cliniques, hôtels, écoles, microfinance | 15 à 30 M | 500 000 à 1 M par mois |
| Site institutionnel, grande entreprise | Banques, industriels, sociétés d'État | 25 à 50 M | 2,5 à 5 M par mois |
| Portail grand compte (espaces clients, intégrations) | Mines, banques, sociétés d'État | 50 à 300 M (souvent par appel d'offres) | 5 à 10 M par mois |

**Conseils :**
- Paiement en 2 ou 3 fois : 50 % à la commande et 50 % à la mise en ligne, ou 40 / 40 / 20.
- Pour les très petites entreprises, une **formule abonnement** sans gros apport : 300 000 à 500 000 GNF par mois sur 12 mois, création comprise.
- **Toujours vendre la maintenance mensuelle** : c'est elle qui fait vivre l'agence. Avec 10 sites par jour, au bout d'un mois, des centaines d'abonnements tournent.
- Offrir la première année d'hébergement pour signer plus vite.

---

## 8. Organisation pour tenir 10 sites par jour

1. **Trois modèles prêts à l'emploi**, réutilisés et personnalisés : (a) vitrine avec WhatsApp, (b) rendez-vous ou réservation, (c) catalogue avec espace admin. Chaque site se monte alors en 1 à 2 heures.
2. **La veille au soir** : préparer les maquettes des 10 prospects du lendemain à partir de leur Facebook (logo, photos, textes).
3. **Le matin** (9 h à 12 h) : appels et visites groupés par quartier (Kaloum, Dixinn, Kipé, Ratoma, Matam) pour enchaîner les rendez-vous.
4. **L'après-midi** : finaliser et mettre en ligne sur Cloudflare (domaine, HTTPS, emails, double authentification sur l'espace admin), puis former le client en 15 minutes.
5. **Le soir** : relancer les grandes entreprises (audit gratuit et maquette envoyés).
6. **Suivi** : utiliser le fichier `entreprises_guinee_consolide.csv` comme fichier clients. Ajouter les colonnes « appelé le », « réponse » et « montant signé ».

---

## 9. Prochaines étapes recommandées

- [ ] Ouvrir les 60 liens de sites existants et noter : vitesse, mobile, HTTPS, dernière mise à jour.
- [ ] Faire une recherche Google de 2 minutes sur chacun des 10 prospects de demain avant d'appeler.
- [ ] Autoriser l'accès web dans les réglages réseau pour que je puisse auditer les sites automatiquement et collecter des centaines de fiches supplémentaires (restaurants, salons, pharmacies…).
- [ ] Préparer le dossier administratif de l'agence (RCCM, NIF, attestations) pour les grandes entreprises et les sociétés publiques.
