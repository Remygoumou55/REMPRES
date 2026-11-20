# Prospection Guinée : fichier de reprise (pour tout agent qui continue le travail)

**Branche Git :** `claude/guinea-companies-research-uckpb8` (dépôt `remygoumou55/rempres`)
**Dernière mise à jour :** 20 novembre 2026

Lis ce fichier en premier, puis `RAPPORT_GLOBAL.md`.

## 1. Le projet

Le propriétaire a une agence web à Conakry, en Guinée. Il crée des sites web professionnels premium avec un espace de gestion (admin), le tout hébergé sur Cloudflare (domaine, HTTPS, double authentification). Objectif : **10 sites par jour pour 10 entreprises différentes.** Trois sites clients sont déjà livrés et les clients sont satisfaits.

Langue de travail : **français**. Le propriétaire n'est pas développeur : explique-lui simplement ce que tu fais.

## 2. Ce qui est fait

| Fichier | Contenu |
|---|---|
| `RAPPORT_GLOBAL.md` | Rapport stratégique : vue d'ensemble, méthode de score, **top 10 des sites à faire**, arguments de vente, grille de prix en GNF, organisation pour tenir 10 sites par jour |
| `LISTE_COMPLETE.md` | Les 317 entreprises par catégorie (petite / moyenne / grande), séparées entre sans site et avec site (avec liens), triées par score |
| `entreprises_guinee_consolide.csv` | Le même contenu en tableur (séparateur `;`, UTF-8 avec BOM, s'ouvre dans Excel), avec les 5 sous-scores |
| `brut/*.csv` et `brut/*_notes.md` | Les données des 3 agents de recherche (petites, moyennes, grandes) et leurs synthèses |
| `clients/clinique-pasteur/PROMPT_RECHERCHE_CLAUDE_CHROME.md` | Le brief donné à Claude dans Chrome pour collecter infos et images sur la Clinique Pasteur |
| `../../scripts/prospection/consolider.py` | Fusionne `brut/*.csv`, retire les doublons (liste `RETIRER`), calcule le score et écrit le CSV consolidé |
| `../../scripts/prospection/generer_listes.py` | Regénère `LISTE_COMPLETE.md` à partir du CSV consolidé |

Pour regénérer les listes après modification des fichiers bruts :
```bash
python3 scripts/prospection/consolider.py && python3 scripts/prospection/generer_listes.py
```

## 3. Limites connues des données

- **Aucun site n'a été ouvert directement.** Le réseau de la session bloquait curl et WebFetch, seule la recherche web marchait. « ACTIF » veut dire « trouvé par les moteurs de recherche », pas « audité ».
- **Les téléphones** viennent d'annuaires et de pages Facebook, parfois de 2018. Aucun n'a été vérifié par appel.
- **Les tailles d'entreprise** sont des estimations.
- **Règle à garder : ne jamais inventer de coordonnées.** Écrire « non trouvé » et citer la source (URL).

## 4. Prochaines étapes (dans l'ordre)

1. **Clinique Pasteur (prospect n°1)** : le propriétaire lance la recherche avec Claude dans Chrome, à l'aide du brief ci-dessus. Quand il colle le rapport, l'enregistrer dans `clients/clinique-pasteur/RAPPORT_RECHERCHE.md`, puis **construire le site** : vitrine, spécialités, médecins, urgences 24/7, prise de rendez-vous, page entreprises et assurances, contact avec carte, version anglaise, espace admin, déploiement sur Cloudflare.
2. **Faire la même chose pour les 9 autres prospects du top 10** (section 4 de `RAPPORT_GLOBAL.md`) : un dossier par client, `clients/<nom-client>/`, contenant le brief de recherche, le rapport de recherche et le site.
3. **Auditer les 60 sites existants** (vitesse, mobile, HTTPS, mises à jour) dès que le réseau le permet.
4. **Agrandir la base** : il faudrait autoriser `goafricaonline.com` dans les réglages réseau. GoAfrica liste 369 restaurants et 288 salons de coiffure à Conakry.
5. **Suivi commercial** : ajouter au CSV les colonnes `appele_le`, `reponse` et `montant_signe`.

## 5. Règles de travail

- Commit et push **sur cette branche** après chaque étape importante, pour que rien ne se perde.
- Ne pas créer de pull request sans demande explicite du propriétaire.
- Un dossier par client dans `clients/`.
