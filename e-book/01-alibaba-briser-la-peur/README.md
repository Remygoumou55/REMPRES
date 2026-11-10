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

---

## Communication — NOUVEAU (10 nov. 2026)
- **Plan de 10 vidéos motion design** (Google Flow bloqué), mêmes règles que le livre 2 : `communication/07-PLAN-10-VIDEOS-MOTION-DESIGN.md`. Plan VALIDÉ (prix 3 900 F, sans prix barré). 10 scripts : `communication/08-SCRIPTS-10-VIDEOS.md`. En attente : voix et image 3D du guide.

## Communication (état au 7 nov. 2026)
- **Vidéos finales à utiliser en pub :** `communication/campagne/A-COMBINEE-transitaire.mp4` (42,7 s), `B-COMBINEE-grossiste.mp4` (40,1 s, personnages Kouamé + Moussa), `C-COMBINEE-debutant.mp4` (51,5 s).
- Variantes : `A1..A3`, `B1..B3`, `C1..C3` (une accroche chacune), `video-3/V3-ton-colis-est-en-retard.mp4`, `video-5/V5-tu-importes-depuis-des-annees.mp4`.
- Sélection recommandée au client : A-combinée ❤️, A2, B-combinée, C-combinée.
- Fabrication : `communication/campagne/` — `engine.js` (moteur d'animation piloté par le temps), `video{A,B,B2,C}.html`, `build.mjs` (`node build.mjs A`), `combo.mjs` (`node combo.mjs A h1 h3`), `comboB2.mjs`, `music.py` (musique originale), voix dans `voix/`, scripts voix off `SCRIPTS-VOIX-OFF-ElevenLabs.txt`.
- Stratégie : `communication/04-strategie-campagne.md` ; kit de lancement (plan Meta, budgets, textes) : `communication/06-kit-de-lancement.html`.
- Visuels : `communication/05-prompts-visuels-boutique-et-pubs.txt` (V01–V07, P01–P05) + images à joindre `communication/visuels-a-joindre/`. **Le client les a générés mais ne les a pas encore envoyés pour contrôle.**
- En attente : versions courtes 25–30 s (couverture visible avant 9 s) ; lien Chariow.
- Recherches du livre : `recherches-du-livre/` (01–05) ; recherches pub : `communication/recherches/` (06–08).
