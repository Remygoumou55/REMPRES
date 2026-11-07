# Livre 2 — sources du PDF

- `src/book/*.html` : le livre, dans l'ordre des noms de fichiers (00 couverture, 01 mode d'emploi, 10 partie 1 = ch. 1-2, 20 bandeau partie 2, 21 ch. 3, 22 ch. 4, 23 ch. 5, 24 ch. 6, 25 ch. 7, puis 30… partie 3, 40… partie 4, 50… partie 5, 60… fiches pays, 70 lexique, 80 mentions). `src/bonus/*.html` : les kits (un fichier par kit, `<!-- title: ... -->` en tête).
- **Style : `styles/carnet.css` + `carnet-phone.css` (« Carnet de terrain »)**, validé par le client le 7/11 : Times New Roman (Liberation Serif), grande police (13 pt A4, 12 pt téléphone), une seule colonne, aucun tableau ni encadré coupé, ligne de « bornes » orange sous chaque titre de chapitre. Les anciens `book.css`/`terrain.css` (style du livre 1) ont été refusés.
- Classes utiles : `.box` + `brief / words / vraie / case / debutant / expert / avoid / tip / check / exo`, `.verif`, `.pays` (cartes pays), `ol.steps` (liste à pastilles), `table.data.keep` (petit tableau jamais coupé), `.calc` (calcul), `.voix` (phrase de la diaspora), `.note-src` (note de fin de chapitre).
- **« Les mots à connaître » : 3 mots maximum par encadré** (1/2, 2/2…), sinon l'encadré peut être coupé.
- Construire : `node e-book/02-terrain-construction/livre/build.mjs` (A4) et `PHONE=1 node …/build.mjs` (téléphone). PDF dans `dist/`.
- Contrôler les pages : `python3 controle-pages.py dist/Terrain-et-construction-telephone.pdf /tmp/ph` → liste des pages remplies à moins de 60 % + planches d'images (`sheet-N.png`) à regarder.

## Règles d'écriture (rappel)
Tutoiement, français très simple, chaque mot difficile en simple + en pro. **Faits réels ANONYMES** (règle n°1, voir `../RAPPORT-JURIDIQUE.md`) : titre « Fait réel — Afrique de l'Ouest, 2026 » (ou Afrique centrale, Europe), pas de pays, ville, nom, fonction précise, montant exact, journal. Citations de forums sans pseudo ni site, lieux remplacés par « au pays ». Montants jamais arrondis vers le haut. Ce qui n'est pas sûr est écrit « à confirmer avec le notaire ».

## Avancement
- 7 nov. 2026 : maquette validée (couverture, mode d'emploi, ch. 1, 2, 4).
- 7 nov. 2026 (agent 2) : corrections de la maquette (titre « 10 pièges », mention « MAQUETTE » retirée), **ch. 3, 5, 6, 7 écrits** → parties 1 et 2 complètes (A4 56 p., téléphone 95 p.). Réglages de mise en page : plus d'encadré « En bref » coupé après un bandeau de partie, version téléphone plus compacte.
- 7 nov. 2026 (agent 2) : **ch. 8, 9, 10 écrits** → partie 3 complète (A4 74 p., téléphone 125 p.).
- 7 nov. 2026 (agent 2) : **ch. 11 à 17 écrits** (`40-partie4.html` … `45-ch16.html`, `50-partie5.html`) → tous les chapitres faits (A4 120 p., téléphone 201 p.).
- 7 nov. 2026 (agent 2) : **fiches pays** (`60-fiches.html`), **lexique** 72 mots avec l'anglais (`70-lexique.html`, généré par un petit script Python), **mentions** (`80-mentions.html`), **sommaire automatique** (`02-sommaire.html` ; `build.mjs` repère « CHAPITRE NN », « FICHE PAYS N », « ANNEXE · LEXIQUE », « ANNEXE · MENTIONS ») → A4 150 p., téléphone 253 p.
- 7 nov. 2026 (agent 2) : **4 kits** (`src/bonus/kit-1-checklists`, `kit-2-modeles`, `kit-3-calculs`, `kit-4-carnets`), resserrage de la mise en page (A4 139 p., téléphone 252 p.), **ZIP** `dist/Terrain-et-construction-pack-complet.zip`. Contrôle : 37 faits réels, aucun pays/ville/nom dedans ; aucun encadré coupé.
- 7 nov. 2026, **1re relecture du client** appliquée : titre ch. 1 avec « ? » ; virgules au lieu de « + » dans l'En bref du ch. 1 ; **« Les mots à connaître » = UN SEUL encadré par chapitre** (il peut continuer sur la page suivante, chaque mot reste entier) ; mot en gras noir, « Définition simple : », « En jargon professionnel : » (aussi dans le lexique) ; idées fausses du ch. 2 avec un niveau : Erreur / Grosse erreur / Très grosse erreur ; **nouveau résumé « Tu es pressé ? L'essentiel en 10 minutes »** (`03-essentiel.html`) mis en avant dans le sommaire et le mode d'emploi ; **sommaire cliquable**. A4 141 p., téléphone 259 p.
- **Reste** : relecture du client, adresse Gmail, prix. Ancienne liste : fiches pays, lexique, mentions, sommaire, kits (prévu : Kit 1 checklists, Kit 2 modèles, Kit 3 calculs, Kit 4 carnets de suivi), ZIP.
- Faits utilisés : vérifiés sur les pages sources (T7, T10, T11 en priorité), rendus anonymes.
