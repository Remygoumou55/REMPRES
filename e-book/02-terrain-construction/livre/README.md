# Livre 2 — sources du PDF

- `src/book/*.html` : le livre (00 couverture, 01 mode d'emploi, 10 partie 1, 20 partie 2…). `src/bonus/` : les kits (à venir).
- **Style actuel : `styles/carnet.css` + `carnet-phone.css` (« Carnet de terrain »)** demandé par le client le 7/11 : police Times New Roman (Liberation Serif, mêmes mesures, si Times absent), grande taille (13 pt A4, 12 pt téléphone), une seule colonne, aucun tableau coupé, encadrés entiers sur leur page, ligne de « bornes » orange sous chaque titre de chapitre. Les anciens `book.css`/`terrain.css` (style du livre 1) ont été refusés par le client.
- Construire : `node e-book/02-terrain-construction/livre/build.mjs` (A4) et `PHONE=1 node …/build.mjs` (téléphone). PDF dans `dist/`.
- Tutoiement (« tu »), français très simple, chaque mot difficile en simple + en pro, faits réels sourcées (source en bas de l'encadré).

## État
- 7 nov. 2026 : **maquette** = couverture provisoire, mode d'emploi, chapitres 1, 2 et 4 (13 p. A4 / 33 p. téléphone). Envoyée au client pour valider le style.
- Faits utilisés : vérifiés sur les pages sources (T7, T10, + vérification du 7/11 : Lac Rose 216,8 M F / 43 parcelles — Dakaractu & AllAfrica 18/07/2025 ; faux maire de Jaxaay 14 cachets — Seneweb).
