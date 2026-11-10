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
- **Plan de 10 vidéos motion design** (Google Flow bloqué), mêmes règles que le livre 2 : `communication/07-PLAN-10-VIDEOS-MOTION-DESIGN.md`. Plan VALIDÉ (prix 3 900 F, sans prix barré). 10 scripts : `communication/08-SCRIPTS-10-VIDEOS.md` (version 2 courte = celle utilisée). Images 3D reçues (fond transparent) : `communication/images-3d/` guide-3d, kit1-3d, kit3-3d (Kit 2 manquant). Vidéos dans `communication/videos/` (un dossier par vidéo, voix dans `videos/voix/`).
- **F2 « L'iceberg » FINIE** : `communication/videos/F2-l-iceberg.mp4` (42,5 s) — iceberg 3D facetté, plongée sous l'eau (transport, douane, taxes, frais du port, pièces abîmées), vraies captures Alibaba du livre (accueil avec prix entourés → recherche « sac à main femme » 4,50 $ entouré), barre du vrai coût (4,78 + 1,50 + 2,63 + 0,58 ≈ 9,48 $, marge 0,52 $), « NON. », calcul ligne par ligne, vraies pages du livre p. 99 et Kit 1 fiche 4 remplie à la main, guide + Kit 1, fin = guide qui flotte + 3 900 F ; bleu glacier + orange, Inter Display + JetBrains Mono, sous-titres verre givré ; musique verre + pizzicati + basse (mi mineur → sol majeur, 84 bpm), son bas.
- **F5 « La fausse usine » FINIE** : `communication/videos/F5-la-fausse-usine.mp4` (37,8 s), voix `videos/voix/F5.mp3` (35,3 s, texte de la version 2 ; reçue sans texte, identifiée par le rythme des pauses) — plateau de cinéma : façade d'usine 3D « FACTORY » qui tourne et révèle un DÉCOR en carton, profil « Fabricant » (nom flouté), schéma vraie usine → « fabricant » revendeur → toi (+ sa marge, contrôle barré), message « c'est la faute de l'usine », 3 badges qui se retournent (Gold Supplier = abonnement payé), vraie checklist 11 points du livre (p. 55–56) cochée, appel vidéo de la ligne de production, « en une journée », fin = clap « Prise 1 » + guide + kits 1 et 3 + 3 900 F ; noir studio + jaune #FFC83D + orange, Anton + Inter, sous-titres « cinéma » sans boîte ; musique cordes staccato + cor + balais (ré mineur → fa majeur, 96 bpm), son bas.
- **NOUVELLE DIRECTION (avatars débutant + vendeur du marché local)** : scripts `communication/09-SCRIPTS-AVATARS-DEBUTANT-ET-MARCHE.md` (D1–D5, M1–M5). F2 et F5 gardées pour l'avatar 3 (plus tard).
- **D1 « Par où commencer » FINIE** : `communication/videos/D1-par-ou-commencer.mp4` (46 s) — carnet à lignes + croquis à main levée qui « vibrent » (dessin animé) : bonhomme au carrefour de flèches (Dropshipping ? Alibaba ? 1688 ?…), téléphone plein de conseils contradictoires (Facebook, TikTok), calendrier « Mois 1 → Mois 2 », « Vidéo n° 248 », d'autres commandent/reçoivent/vendent, « plus forts ? plus intelligents ? » barrés, « Ils ont suivi un ordre », vraie carte des 10 étapes (p. 13) puis route dessinée où chaque étape s'allume au mot près, vrai plan 30 jours (p. 122, sans l'encadré « riche ») surligné semaine par semaine, fin = guide + kits 1 et 3 + prix entouré au feutre ; papier crème + encre bleu nuit + orange + surligneur jaune, Poppins ; musique ukulélé + piano jouet + claquements de doigts (do majeur, 104 bpm), son bas.
- **D2 « La peur de perdre son argent » FINIE** : `communication/videos/D2-la-peur-de-perdre-son-argent.mp4` (39,2 s), voix `videos/voix/D2.mp3` (reçue sans texte, identifiée phrase par phrase = texte de 09) — nuit étoilée : pièce d'or qui part d'un téléphone « Envoyer » vers une silhouette sans visage dans le brouillard, s'arrête « C'est ça qui te bloque ? », carton qui s'ouvre « VIDE », bouton « Commencer » jamais cliqué (0 %), ampoule qui s'éteint, d'autres qui passent en courant, puis bouclier vert qui protège la pièce, « Payé sur Alibaba / Trade Assurance », cas couverts, « ↩ Remboursement », vraie page « Ce que Trade Assurance couvre (et ne couvre pas) » (p. 77–78), vrai tableau des 10 signaux (p. 117–118, sans le cas réel chiffré), « 1 échantillon d'abord », fin = guide dans le bouclier + kits + 3 900 F ; bleu nuit + or #F5C542 + vert #2BD99F, Montserrat ; musique nappe de nuit + cloches de verre + battement doux (la mineur → do majeur, 78 bpm), son bas.
- **D4 « Pas besoin d'aller en Chine » FINIE** : `communication/videos/D4-pas-besoin-d-aller-en-chine.mp4` (37,2 s), voix `videos/voix/D4.mp3` (reçue sans texte, identifiée = texte de 09) — style « billet d'avion » : carte d'embarquement TON PAYS → CHINE tamponnée « INUTILE » et déchirée, le téléphone la remplace, cartes « ceux qui voyagent / connaissent du monde / gros moyens » derrière une corde « RÉSERVÉ », chaîne usine → ceux qui ont osé (+ marge) → toi, téléphone avec les écrans du livre (compte, paiement), 3 cartes de paiement (illustrations du livre), route du transitaire Chine → chez toi, éventail d'écrans, fin = « TON BILLET : TA 1re IMPORTATION » + guide + 3 900 F ; sable + bleu canard + corail, Inter Display + JetBrains Mono, sous-titres « étiquette bagage » ; musique guitare picking + shaker + carillon d'aéroport (ré majeur, 100 bpm), son bas.
- Voix reçues sans texte le 10 nov. (22:27–22:37), identifiées phrase par phrase : D5, M1, D3, M3, M4, M2 → `videos/voix/`. M5 pas encore reçue.
- **D3 « Ni chinois ni anglais » FINIE** : `communication/videos/D3-ni-chinois-ni-anglais.mp4` (42,7 s) — papier + rouge encre, sceau 译 : bulles en chinois et en anglais face à « Euh… 😅 », poignée de main, mots anglais qui pleuvent sur l'appli qui se ferme, commande « ❓ » puis mauvaise couleur/taille/quantité, « Ça ne correspond pas », discussion où le message français se tape et arrive traduit, écran « Paramètres de traduction » du livre, vraie page Kit 3 « Les 15 messages » (message 1 FR/EN), étiquettes prix / échantillon / réclamation, fin guide + kits + 3 900 F ; musique cithare chinoise + piano qui se répondent (pentatonique, 88 bpm), son bas.

## Communication (état au 7 nov. 2026)
- **Vidéos finales à utiliser en pub :** `communication/campagne/A-COMBINEE-transitaire.mp4` (42,7 s), `B-COMBINEE-grossiste.mp4` (40,1 s, personnages Kouamé + Moussa), `C-COMBINEE-debutant.mp4` (51,5 s).
- Variantes : `A1..A3`, `B1..B3`, `C1..C3` (une accroche chacune), `video-3/V3-ton-colis-est-en-retard.mp4`, `video-5/V5-tu-importes-depuis-des-annees.mp4`.
- Sélection recommandée au client : A-combinée ❤️, A2, B-combinée, C-combinée.
- Fabrication : `communication/campagne/` — `engine.js` (moteur d'animation piloté par le temps), `video{A,B,B2,C}.html`, `build.mjs` (`node build.mjs A`), `combo.mjs` (`node combo.mjs A h1 h3`), `comboB2.mjs`, `music.py` (musique originale), voix dans `voix/`, scripts voix off `SCRIPTS-VOIX-OFF-ElevenLabs.txt`.
- Stratégie : `communication/04-strategie-campagne.md` ; kit de lancement (plan Meta, budgets, textes) : `communication/06-kit-de-lancement.html`.
- Visuels : `communication/05-prompts-visuels-boutique-et-pubs.txt` (V01–V07, P01–P05) + images à joindre `communication/visuels-a-joindre/`. **Le client les a générés mais ne les a pas encore envoyés pour contrôle.**
- En attente : versions courtes 25–30 s (couverture visible avant 9 s) ; lien Chariow.
- Recherches du livre : `recherches-du-livre/` (01–05) ; recherches pub : `communication/recherches/` (06–08).
