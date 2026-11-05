# E-book n°1 : Importer de Chine sans se faire arnaquer

Collection Playbooks E-commerce, volume 1. Livre principal + 3 kits bonus, en PDF.

## Fichiers prêts à vendre (`dist/`)
- `Importer-de-Chine-sans-se-faire-arnaquer.pdf` : le livre (54 pages, 16 chapitres)
- `kit-1-calculs.pdf` : coût de revient, prix de vente, CBM, poids volumétrique
- `kit-2-checklists.pdf` : produit gagnant, fournisseur, transitaire, suivi de commande
- `kit-3-messages.pdf` : 15 messages FR/EN, modèle de réclamation, glossaire

## Ajouter les captures d'écran
Déposez les images générées dans `images/` sous les noms `capture-01.png` à `capture-16.png`
(png, jpg ou webp). Tant qu'une image manque, un cadre numéroté la remplace dans le PDF.
Les prompts à donner à ChatGPT sont dans `PROMPTS-CHATGPT.md`.

## Régénérer les PDF
```
node ebooks/01-importer-alibaba/build.mjs
```
Le texte est dans `src/book/` (un fichier par partie) et `src/bonus/`, la mise en page dans `styles/book.css`.
