# E-book n°1 : Briser la peur d'importer (le guide Alibaba pas à pas)

Collection Playbooks E-commerce, volume 1. Livre principal + 3 kits bonus, en PDF.

## Fichiers prêts à vendre (`dist/`)
- `Briser-la-peur-d-importer.pdf` : le livre (60 pages, 16 chapitres)
- `kit-1-calculs.pdf` : coût de revient, prix de vente, CBM, poids volumétrique
- `kit-2-checklists.pdf` : produit gagnant, fournisseur, transitaire, suivi de commande
- `kit-3-messages.pdf` : 15 messages FR/EN, modèle de réclamation, glossaire

## Ajouter les captures d'écran
Déposez les images générées dans `images/` sous les noms `capture-01.png` à `capture-16.png`
(png, jpg ou webp). Tant qu'une image manque, un cadre numéroté la remplace dans le PDF.
Les prompts à donner à ChatGPT sont dans `PROMPTS-CHATGPT.md`.

## Régénérer les PDF
```
node ebooks/01-importer-alibaba/build.mjs            # version imprimable A4
PHONE=1 node ebooks/01-importer-alibaba/build.mjs    # version téléphone
```
Le texte est dans `src/book/` (un fichier par partie) et `src/bonus/`, la mise en page dans `styles/book.css`.

Les PDF utilisent des copies JPEG des images : `images-print/` (A4) et `images-phone/` (téléphone, allégées). Après avoir changé une image dans `images/`, régénérez ces copies.
