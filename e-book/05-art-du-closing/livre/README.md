**ÉTAT AU 12 NOV. 2026 — PRÊT À VENDRE.** Titre : « Ne laisse plus partir tes clients ».
- Livre A4 : `python3 build-pdf-v2.py` → `dist-v2/L-Art-du-Closing-livre-complet.pdf` (143 p.).
- Livre téléphone : `PHONE=1 python3 build-pdf-v2.py` → `dist-v2/L-Art-du-Closing-telephone.pdf` (212 p.).
- Kits (A4 et téléphone) : `KIT=$PWD/kits/kit-N-….md [PHONE=1] OUT=… python3 build-pdf-v3.py` → `dist-v3/`.
- ZIP : `bash make-zip.sh` → `dist-v2/Ne-laisse-plus-partir-tes-clients-pack-complet.zip`.
- Couverture : `python3 make-cover-bg.py` fabrique les fonds A4 et téléphone à partir de `illustrations/cover-src.jpg`.

**DÉCISION DU CLIENT (11 nov. 2026) : on travaille sur la VERSION LONGUE de 226 pages** (`manuscrit-v2/`, build `python3 build-pdf-v2.py`, PDF `dist-v2/L-Art-du-Closing-livre-complet.pdf`). La version courte v3 (60 p.) et ses kits restent disponibles.

**11 nov. 2026 — ALLÈGEMENT FAIT (choix « B ») : la version longue passe de 226 à 139 pages A4**, sans perdre d'idée. Règles et tableau chapitre par chapitre : `REGLES-ALLEGEMENT-V2.md`. Phrases retirées à remettre dans les kits : `kits/A-AJOUTER-DEPUIS-V2.md`.

**11 nov. 2026 — ILLUSTRATIONS :** 13 prompts BD pour ChatGPT, plus une planche des personnages, dans `illustrations/PROMPTS-ILLUSTRATIONS-BD.md`. Le client crée les images et les dépose dans `illustrations/` (noms `ill-01-…png` à `ill-13-…png`). Ensuite, on les place dans le livre (environ 148 pages au total). **12 nov. :** les images sont en JPG dans `illustrations/`, placées avec `<figure class="ill">` dans le manuscrit. L'image de la partie 2 passe par `PART_IMG` dans `build-pdf-v2.py`. Suivi image par image : en bas du fichier des prompts.

**12 nov. — COUVERTURE :** la couverture est en pleine page. Elle est rendue à part (`_cover.html`, marge 0), puis collée devant le livre avec pypdf. Le fond vient de `make-cover-bg.py` (vert + image fondue). Le texte (titre, accroche, étiquettes) est dans `COVER` de `build-pdf-v2.py`. L'image actuelle est provisoire (ill-01) : on la remplacera par `illustrations/cover-src.jpg`, à faire selon `illustrations/PROMPT-COUVERTURE.md`.

# Livre — « L'Art du Closing » : manuscrit

**ÉTAT (9 nov. 2026) : VERSION COURTE v3 = LA VERSION OFFICIELLE.** Le client a refusé le pavé de 226 pages (règle : 55–80 pages max).
- Manuscrit : `manuscrit-v3/` (13 chapitres + l'essentiel + parlons de toi + lexique + sources). Build : `python3 build-pdf-v3.py` (A4) et `PHONE=1 python3 build-pdf-v3.py` (téléphone 110×196 mm).
- PDF : `dist-v3/L-Art-du-Closing.pdf` (**60 pages A4**, couverture + sommaire + annexes compris) et `dist-v3/L-Art-du-Closing-telephone.pdf` (105 petites pages).
- Structure par chapitre (allégée) : accroche → exemples → Tu as remarqué ? → Dans ce chapitre → contenu → 1 quiz (bonne réponse d'abord) → Dans ta situation (tableau A–E) → « À retenir » (checklist + erreur + Et maintenant ?).
- Prochaine étape : les 4 kits (8–12 pages max chacun, ~40 pages au total) : Kit 1 réponses prêtes, Kit 2 messages à copier, Kit 3 cahier d'entraînement, Kit 4 fiches métier (1 page par profil).
- La version longue (226 p.) est gardée comme réservoir de contenu pour les kits : `manuscrit-v2/`, `dist-v2/`.

---

# Livre — « L'Art du Closing » : manuscrit

**ÉTAT (9 nov. 2026) : LIVRE COMPLET v1 écrit** → `dist-v2/L-Art-du-Closing-livre-complet.pdf` (226 pages A4, ~105 000 mots, Times 14 pt). 28 chapitres en 5 parties + lexique (79 mots) + sources + mentions. En attente de la relecture complète du client (il corrige tout en une fois).
- Règles et plan : `../06-GUIDE-REDACTION.md` (structure obligatoire de chaque chapitre, profils A–E, vocabulaire, frontières entre chapitres, règles sur les citations et chiffres).
- Contrôles faits : toutes les citations « témoignages réels » vérifiées contre `recherches/` (traductions fidèles), aucune ville, aucun chiffre interdit (seulement cités pour être démentis), bonne réponse d'abord dans chaque quiz.
- Rebuild : `python3 build-pdf-v2.py` (OUT=nom.pdf pour changer le nom).

# Livre — « L'Art du Closing » : manuscrit

- **v2 (en cours, 9 nov. 2026)** : `manuscrit-v2/` → PDF via `python3 build-pdf-v2.py` → `dist-v2/`.
  Refonte demandée par le client : livre **interactif** (scènes « Mets-toi à la place de… », quiz A/B/C + bonne réponse + bonne action, exercices « Entraîne-toi », encadré « Dans ta situation » pour 4 profils : A Fanta marché, B Ibrahim boutique en ligne, C Amina digital, D Koffi commercial), **aucune ville** citée (personnages sans lieu, citations réelles attribuées à une région), étapes **enchaînées** (encadré « Et maintenant ? » : ce que tu sais / ce qui vient / si tu sautes), réalité africaine centrale : **le client qui demande le prix et part** (ch. 2, PRIX + QUESTION, question de la dernière chance, relance en 3 messages).
  Design nouveau : **Times New Roman 14 pt** (Liberation Serif embarquée, mêmes métriques), vert forêt #123B2F + or #B08A3E + crème.
  Partie 1 v2 : 00 Avant de commencer · 1 Le closing c'est quoi · 2 Le client qui demande le prix et part · 3 Dans la tête du client (4 réalités) · 4 Le rideau et le mur · 5 Les 20 erreurs.
  Méthode RIDEAU : **R = Retenir et créer la relation** (gagner le droit de discuter), I Interroger, D Démasquer, É Écouter, A Apaiser, U Unir.
- **v1 (refusée par le client)** : `archive-v1/`.
