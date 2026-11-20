# Prospection petites entreprises en Guinée : synthèse

Fichier de données : `petites.csv` (141 entreprises, séparateur `;`).
Date de collecte : novembre 2026.

## Limites de la méthode (à lire d'abord)

- **Les sites n'ont pas été vérifiés techniquement.** Pendant la collecte, l'environnement bloquait les connexions sortantes : curl et WebFetch ont été refusés sur goafricaonline.com, guinee-pages.com, facebook.com, google.com et tripadvisor.fr. Toutes les données viennent des extraits de WebSearch (titres, descriptions de pages Facebook, fiches GoAfrica, Petit Futé, Tripadvisor, Cybo, presse guinéenne).
- `statut_site = ACTIF` veut dire seulement que le site est indexé par un moteur de recherche ou cité par l'entreprise. Il n'a pas été testé par curl. Chaque ligne concernée porte la mention « non vérifié par curl ». Il faut contrôler ces sites avant tout rendez-vous.
- Les téléphones sont ceux affichés sur les pages Facebook ou les fiches d'annuaire. Ils peuvent être anciens, et aucun n'a été appelé. Quand une donnée manquait dans la source, la cellule indique « non trouvé ».
- La forme juridique est rarement publique pour ces structures, d'où « non trouvé » dans presque tout le fichier.
- Pour aller plus loin : faire autoriser goafricaonline.com et guinee-pages.com dans le réseau de la session. Ces annuaires listent des centaines de fiches avec téléphone (369 restaurants et 288 salons de coiffure sur GoAfrica Guinée).

## Secteurs couverts

| Secteur | Nb |
|---|---|
| Restauration, fast-food, livraison de repas, traiteur | 18 |
| Pâtisserie et boulangerie | 10 |
| Coiffure et beauté | 11 |
| Cosmétiques | 8 |
| Mode et prêt-à-porter | 8 |
| Couture et stylisme | 8 |
| Immobilier (agences, meublés) | 9 |
| Santé dentaire | 8 |
| Photographie et vidéo | 8 |
| Auto-écoles | 8 |
| Garages et automobile | 6 |
| Location de voitures | 3 |
| Salles de sport | 7 |
| Formation (informatique, langues, couture) | 8 |
| Agences de voyage | 7 |
| E-commerce et startups | 8 |
| Quincaillerie, matériaux, menuiserie | 5 |
| Événementiel, hôtellerie | 2 |

Couverture géographique : surtout Conakry (Ratoma, Kipé, Lambanyi, Nongo, Kaloum, Matam, Dixinn, Matoto). Quelques entreprises à Kankan, Labé et Kindia.

## Maturité web observée

- **98 sur 141 (70 %) ont seulement Facebook, Instagram ou TikTok**, et vendent souvent par WhatsApp. C'est le cœur de cible.
- **29 sur 141 (21 %) n'ont aucune présence web propre** : ni site ni page sociale trouvée, seulement une fiche GoAfrica, Tripadvisor, Petit Futé ou Cybo.
- **14 sur 141 (10 %) ont un site indexé** : e-commerce (Omakiti, ECOM Guinée, Afri-Store, Margaarou, Arabinènè), agences de voyage (Guinée Voyages, Groupe Mondial Tours, Anata Voyage), Waraba Fitness, AF Location, Wedrive, Cré'Art, SAFABHE et Dentistes du Sud. Ces sites restent à auditer : vitesse, version mobile, HTTPS, mises à jour. Ce sont des cibles de refonte, de maintenance ou d'hébergement Cloudflare, plutôt que de création.
- **Constats récurrents** :
  - Le téléphone ou WhatsApp est le canal principal.
  - Le paiement passe par Orange Money.
  - Les catalogues sont publiés en posts Facebook, donc impossibles à chercher et vite enterrés.
  - Aucune réservation ni prise de rendez-vous en ligne.
  - Des pages à forte audience sans site : Couture Mode Africaine (≈20 000 J'aime), Waraba Fitness (≈22K abonnés), Éric Favre Gym (≈12K), Bacam Voyage (≈4 600).

## Top 10 des prospects prioritaires

1. **Auto École Prestige**, +224 623 46 23 49. Se présente comme une auto-école « 100 % VIP » mais n'a que Facebook. Une image haut de gamme justifie un site avec tarifs et inscription en ligne.
2. **Africa Digitale Académie**, +224 627 59 35 35. Une académie du numérique sans site, ce qui rend l'argument évident. Besoins : catalogue de formations, inscription et paiement Orange Money.
3. **Aguimmo**, +224 610 89 89 89. Fait de la vente, de la location, de la construction et de la gestion. Un site d'annonces avec un espace admin pour publier ses biens est un produit récurrent idéal.
4. **Afric-immo**, +224 629 14 59 44, Afric.immo224@gmail.com. Publie déjà beaucoup d'annonces sur Facebook et a un email, donc le contact est facile. Besoin : un catalogue de biens filtrable.
5. **GAG Guinéenne d'Automobile Garage (Kipé)**, +224 627 46 76 76. Se présente comme « clinique automobile » moderne. Besoins : prise de rendez-vous en ligne et liste de services.
6. **Couture Mode Africaine** (≈20 000 J'aime, numéro non trouvé : contacter via Facebook). Grosse audience sans boutique en ligne. Besoins : lookbook, commande sur mesure, WhatsApp.
7. **Hello Eats**, +224 629 54 36 36. Livre déjà des repas avec commande WhatsApp. Un menu en ligne avec panier vers WhatsApp augmente directement les ventes.
8. **Coco Restaurant (Kaloum)**, +224 613 56 38 27. En préparation d'ouverture, c'est le meilleur moment pour vendre un site avec menu et réservation.
9. **Rianne Cosmétiques et Beauté**, +224 620 26 79 63. Importatrice et distributrice avec livraison partout. Besoins : catalogue produits, commandes de gros et de détail.
10. **Clinique Dentaire OSD**, +224 610 51 79 33. Le secteur santé paie mieux et un site renforce la confiance. Besoins : rendez-vous en ligne et page des soins.

À suivre aussi : Waraba Fitness (refonte, abonnements en ligne), Black Studio 224 et les autres photographes (portfolio), MIKA Pâtisserie et Conakry Cake (catalogue de gâteaux et commande).

## Arguments de vente pour les petites entreprises

- **« Facebook ne vous appartient pas »** : une page peut être piratée, suspendue ou rendue invisible par l'algorithme. Un site avec votre nom de domaine reste à vous.
- **Être trouvé sur Google** : quand un client cherche « pâtisserie Kipé » ou « auto-école Conakry », il trouve des concurrents, pas vous.
- **Moins de questions répétées sur WhatsApp** : prix, menu, horaires et localisation sont sur une seule page. Il suffit d'envoyer le lien.
- **Un catalogue toujours à jour** grâce à l'espace admin : vous ajoutez un produit, un plat ou un bien depuis votre téléphone, sans dépendre d'un informaticien.
- **Crédibilité** face aux clients de la diaspora, aux entreprises, aux expatriés et aux ONG : un lien pro et un email @votre-nom.com.
- **Un site rapide même en 3G** : hébergement Cloudflare, peu coûteux et fiable.
- **Paiement local** : bouton WhatsApp, numéro Orange Money ou MTN MoMo affiché, et plus tard un paiement intégré.
- **Démonstration concrète** : arriver avec une maquette déjà faite à partir des photos de leur page Facebook. C'est très efficace auprès des TPE.

## Offres et packs proposés

| Pack | Contenu | Cibles |
|---|---|---|
| **Pack Vitrine WhatsApp** | 1 à 3 pages, présentation, galerie, horaires, carte Google Maps, bouton WhatsApp et appel, domaine et hébergement 1 an | coiffure, couture, garages, photographes |
| **Pack Menu et Commande** | site + menu ou catalogue modifiable dans l'admin, panier qui envoie la commande sur WhatsApp, zones et frais de livraison | restaurants, fast-foods, pâtisseries, cosmétiques |
| **Pack Rendez-vous** | vitrine + prise de rendez-vous en ligne, notification WhatsApp ou email, liste des services et tarifs | dentistes, cabinets, garages, salons, auto-écoles |
| **Pack Catalogue Pro** | annonces ou produits avec filtres (prix, quartier, catégorie), admin multi-photos, formulaire de contact | immobilier, location de voitures, quincailleries, boutiques |
| **Pack Formation** | catalogue de formations, calendrier des sessions, formulaire d'inscription, paiement Mobile Money à la main | centres de formation, auto-écoles |
| **Maintenance mensuelle** | hébergement, mises à jour, petites modifications, sauvegardes, statistiques | tous les clients (revenu récurrent) |
| **Refonte / audit** | audit vitesse, mobile et référencement, puis refonte | les 14 entreprises qui ont déjà un site |

## Fourchettes de prix réalistes (GNF)

Les prix sont indicatifs et à ajuster selon la concurrence locale. Repère : 1 EUR ≈ 9 000 à 10 000 GNF.

| Offre | Prix de création | Récurrent |
|---|---|---|
| Pack Vitrine WhatsApp | 1 500 000 à 3 000 000 GNF | domaine et hébergement : 400 000 à 700 000 GNF/an |
| Pack Menu et Commande | 3 000 000 à 5 000 000 GNF | 150 000 à 300 000 GNF/mois (maintenance et mises à jour) |
| Pack Rendez-vous | 3 500 000 à 6 000 000 GNF | 200 000 à 350 000 GNF/mois |
| Pack Catalogue Pro (immobilier, auto) | 5 000 000 à 9 000 000 GNF | 250 000 à 500 000 GNF/mois |
| Pack Formation | 4 000 000 à 7 000 000 GNF | 200 000 à 400 000 GNF/mois |
| Refonte d'un site existant | 4 000 000 à 10 000 000 GNF | selon le périmètre |

Conseils commerciaux :
- Proposer un **paiement en 2 ou 3 fois**, par exemple 50 % au démarrage et 50 % à la mise en ligne.
- Proposer une **formule abonnement sans gros apport** pour les TPE informelles, par exemple 300 000 à 500 000 GNF/mois sur 12 mois, création incluse.
- Offrir la première année d'hébergement pour signer vite.
- Visiter par quartier (Kipé, Lambanyi, Nongo, Kaloum) pour enchaîner plusieurs rendez-vous dans la même journée.
