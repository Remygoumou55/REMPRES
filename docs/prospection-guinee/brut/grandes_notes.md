# Prospection : grandes entreprises en Guinée, synthèse

Fichier de données : `grandes.csv` (84 entités, séparateur `;`, UTF-8).

## Limite méthodologique importante

L'environnement de travail bloquait toutes les connexions sortantes : `curl` et WebFetch étaient refusés par le proxy pour tous les domaines testés (orange-guinee.com, bcrg-guinee.org, wikipedia.org, google.com…). **Aucun site n'a donc pu être ouvert directement.** Le `statut_site` repose sur ce que montrent les résultats de recherche web :

- `ACTIF` : le domaine apparaît dans des sources récentes ou est indexé avec du contenu (PDF wp-content datés, pages groupe…). Il reste à le confirmer par une visite (temps de réponse, HTTPS, mobile).
- `AUCUN` : aucun site propre n'a été trouvé dans les sources. Cela ne prouve pas qu'il n'existe pas. Il faut vérifier sur Google/Facebook avant de démarcher.
- `CASSE_OU_INJOIGNABLE` : un seul cas (Port Autonome de Conakry), dont le domaine officiel n'a pas pu être établi.

Les téléphones et emails viennent de sources parfois anciennes (liste BCRG 2020/2022, annuaires). Il faut les revérifier avant toute campagne. Les tailles sont des estimations (ordre de grandeur), sauf mention contraire.

## Secteurs couverts (84 entités)

| Secteur | Nb | Exemples |
|---|---|---|
| Banques / finance / microfinance | 18 | Ecobank, Orabank, SGBG, BICIGUI, Vista Bank, Coris, BCI, UBA, Afriland, Access, BSIC, BIG, Skye, FBN, BNIG, BPMG, Crédit Rural |
| Mines | 15 | CBG, SMB, WCS, SimFer, SAG, SMD, CBK, SBG, AMC, GAC, SGMF, SOGUIPAMI, BAM, TBEA, Dynamic Mining |
| Hôtellerie | 6 | Noom, Radisson Blu, Onomo, Palm Camayenne, Riviera Royal, Riviera Taouyah |
| Assurances | 5 | NSIA, SUNU, UGAR Activa, Activa Vie, Lanala |
| Télécoms et régulation | 6 | Orange, Areeba (ex-MTN), Cellcom, Guinée Télécom, GUILAB, ARPT |
| Énergie / eau | 6 | EDG, SEG, SGP, SOGES, TotalEnergies, Vivo Energy |
| Industrie (ciment) et agroalimentaire | 10 | Ciments de Guinée, CIMAF, GI Ciments, Diamond Cement, SOBRAGUI, CIAO, SONOCO, SNC, GMG, Topaz |
| Transport / logistique / port | 7 | Port Autonome, Conakry Terminal (AGL), Alport (Albayrak), MSC, SOGEAG, OPG, The Mining House |
| Distribution | 3 | Imperial Corp. (Carrefour), ZCO Trading (Franprix), Groupe Hyjazi (Prima Center) |
| BTP | 2 | Sogea-Satom, Groupe GUITER |
| Santé | 2 | Clinique Ambroise Paré, Clinique Pasteur |
| Public / institutions / ONG | 6 | CNSS, LONAGUI, APIP, SOGUIPAH, Helen Keller Intl, BNIG |

Statuts : **35 ACTIF**, **48 AUCUN**, **1 CASSE_OU_INJOIGNABLE**, 0 FACEBOOK_SEULEMENT (non mesurable sans accès direct).

## Maturité web observée

1. **Les filiales de groupes internationaux ne sont pas de bons prospects pour un site complet.** Ecobank, UBA, Afriland, SUNU, TotalEnergies, Radisson, MSC, AGL, AngloGold ou Rio Tinto ont souvent juste une page sur le site du groupe, gérée depuis le siège. Le marketing local peut quand même acheter des micro-sites (campagnes, recrutement, événements, RSE).
2. **Les sociétés publiques et parapubliques sont la plus grosse lacune.** CNSS, LONAGUI, SOGEAG, Guinée Télécom, SOGUIPAMI, SOGUIPAH, Port Autonome, OPG et SGP n'ont pas de site identifiable, ou un site peu visible. Plusieurs viennent de changer de statut (SOGEAG en SA en 2025, Areeba nationalisée en déc. 2025, relance de Guinée Télécom). Ce sont des moments propices à une refonte.
3. **Les champions nationaux privés (BTP, agro-industrie, ciment, distribution) sont quasi absents du web** : GUITER, CIAO, SONOCO, SNC, GI Ciments, Topaz, Hyjazi. On trouve leur nom dans la presse, mais pas de site propre.
4. **Plusieurs sites existants tournent sous WordPress** (EDG, SMB, Coris) et publient surtout des PDF. On peut proposer de la maintenance, de la sécurité, de la performance et un vrai espace actualités/appels d'offres.
5. **Le recrutement et les appels d'offres passent par la presse** (guineenews, ledjely, lesannonces224) au lieu des sites des entreprises (CBG, SOGUIPAH, LONAGUI, TotalEnergies). C'est un argument fort pour un module « Carrières » et « Appels d'offres ».
6. Il y a des domaines en HTTP seul ou en .com.gn anciens (UGAR, SEG, ARPT, Palm Camayenne, Riviera Royal). Ils sont probablement à moderniser, à confirmer par audit.

## Top 10 des prospects prioritaires

| # | Entreprise | Pourquoi |
|---|---|---|
| 1 | **Areeba Guinée (ex-MTN)** | Nationalisée en déc. 2025 : il faut une nouvelle identité et un nouveau site hors marque MTN. Le budget public suit la relance. |
| 2 | **SOGEAG SA (aéroports)** | Nouveau statut de SA et nouvelles missions en juil. 2025, trafic en hausse. Besoin d'un site d'infos vols, services et appels d'offres. |
| 3 | **Guinée Télécom** | Opérateur public en relance, sans site identifié. |
| 4 | **SGBG (Société Générale → AFG/Atlantic)** | Changement d'actionnaire en 2025 : rebranding obligatoire du site sgbg.net.gn. |
| 5 | **Ciments de Guinée** | Racheté par Hillside Group en 2025, membre de la World Cement Association en 2026, sans site trouvé. |
| 6 | **Port Autonome de Conakry** | 90 % du commerce maritime, mais domaine officiel incertain. Le site serait une vitrine d'État avec des actualités et des documents réglementaires. |
| 7 | **CNSS Guinée** | Grand établissement public avec la plateforme E-CNSS. Le site institutionnel peut s'accompagner d'un espace assurés et employeurs. |
| 8 | **Groupe GUITER** | Premier BTP guinéen, absent du web. Les références de chantiers aideraient pour les appels d'offres internationaux (Simandou 2040). |
| 9 | **LONAGUI** | Société publique grand public sans site. Il y a un besoin de communiquer les résultats et jeux, avec une forte audience. |
| 10 | **Groupe CIAO / SONOCO / SNC (agro-industrie)** | Industriels en croissance soutenus par l'IFC et Rio Tinto. Il leur faut un catalogue produits, un espace distributeurs et une page RSE. |

À suivre aussi : SOGUIPAMI, SOGUIPAH, BICIGUI (aucun site trouvé pour une grande banque), Palm Camayenne et Riviera Royal (sites indépendants à auditer), Crédit Rural de Guinée, Imperial Corporation (Carrefour : e-commerce/drive).

## Arguments de vente adaptés aux grandes entreprises

- **Crédibilité internationale** : bailleurs (Banque mondiale, IFC, BAD), partenaires miniers et investisseurs vérifient d'abord le site. Un site absent ou daté coûte des opportunités.
- **Espace de gestion autonome** : les équipes communication publient elles-mêmes actualités, communiqués, appels d'offres et offres d'emploi, sans prestataire, et réduisent les insertions presse payantes.
- **Modules métier** : carrières avec candidatures en ligne, appels d'offres et documents (PDF des rapports annuels, ITIE, RSE), formulaires de réclamation ou de contact, bilingue FR/EN (indispensable pour les mines et la logistique).
- **Performance et disponibilité via Cloudflare** : CDN mondial, rapide même sur réseau mobile 3G/4G guinéen, HTTPS, protection anti-DDoS, disponibilité élevée. Coût d'hébergement faible.
- **Sécurité et conformité** : sauvegardes, mises à jour, pas de WordPress vulnérable non maintenu, accès admin par rôles.
- **Proximité locale** : équipe à Conakry, réactivité, facturation en GNF, connaissance des contraintes locales (moyens de paiement, Orange Money, coupures).
- **Moment de transition** : nationalisation, rachat, nouveau statut, relance. C'est le bon moment pour une nouvelle identité numérique.
- **Mesure** : statistiques de visites et rapports mensuels, utiles à la direction générale.

## Niveau de prix envisageable (GNF, indicatif)

Hypothèse : 1 EUR ≈ 9 500 à 10 000 GNF. Ce taux est à ajuster.

| Offre | Contenu | Prix indicatif |
|---|---|---|
| Site institutionnel standard | 8 à 15 pages, FR/EN, admin actualités, contact, Cloudflare, HTTPS | **25 000 000 à 50 000 000 GNF** |
| Site corporate avancé | Plus carrières, appels d'offres, médiathèque/documents, multi-rôles admin, SEO | **50 000 000 à 120 000 000 GNF** |
| Portail grand compte (banque, société d'État, mine) | Plus espaces clients/partenaires, intégrations (formulaires métier, Orange Money), audit sécurité | **120 000 000 à 300 000 000 GNF et plus** (souvent par appel d'offres) |
| Maintenance / hébergement / support | Mises à jour, sauvegardes, évolutions mineures, rapport mensuel | **2 500 000 à 10 000 000 GNF par mois** |

Pour les sociétés d'État, prévoir des procédures de marché public (dossier administratif, attestations fiscales et sociales, références) et des délais de paiement longs. Une offre « audit gratuit + maquette » ouvre efficacement la porte.

## Sources principales

- Listes BCRG des banques (2022, 2023) et des assurances (2020) : https://www.bcrg-guinee.org/wp-content/uploads/2022/01/liste-banques.pdf, https://bcrg-guinee.org/wp-content/uploads/2023/03/BANQUES-AGREEES.pdf, https://www.bcrg-guinee.org/wp-content/uploads/2020/02/societe-assurances.pdf
- APB Guinée : https://apb-guinee.org/reseaux-membres/
- Rapport SOGUIPAMI 2023 : https://minedocs.com/27/SOGUIPAMI-AREV-2023.pdf
- Revue annuelle des sociétés publiques 2024 (lien dans le CSV)
- goafricaonline.com/gn, piaafrica.com, guineenews.org, financialafrik.com, osiris.sn
