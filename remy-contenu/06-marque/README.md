# La marque : le logo et les reçus

Refaits le 13 novembre 2026 à partir de la charte (cahier des charges, section 4).
Seulement les 4 couleurs : bordeaux `#7A1F2B`, crème `#F5EDE0`, or `#D4A017`, noir `#1C1C1C`.
Les polices : Playfair Display, Montserrat ExtraBold, Courier Prime.

## Les fichiers et à quoi ils servent

| Fichier | Taille | Où l'utiliser |
|---|---|---|
| `logo-icone.png` | 1080 × 1080 | **Photo de profil** TikTok, Facebook, YouTube, Instagram |
| `logo-horizontal.png` | 1640 × 624 | **Couverture de la Page Facebook** (le contenu est centré, car Facebook coupe les côtés sur téléphone) |
| `recu-signature.png` | 1080 × 1920 | Le **modèle vide** du reçu |
| `tampon-paye-avec-amour.png` | 760 × 420, **fond transparent** | À poser **au-dessus** du reçu dans CapCut, pour l'animer |
| `recus/video-01-…png` | 1080 × 1920 | Le reçu de la **vidéo 1** (La Facture de Maman) |
| `recus/video-02-…png` | 1080 × 1920 | Le reçu de la **vidéo 2** (L'école) |

Pour chaque vidéo, il y a 3 images :
- `…-sans-tampon.png` : le reçu **avant** que le tampon tombe ;
- `….png` : le reçu **avec** le tampon ;
- `…-fin.png` : **la dernière image**, avec le logo, la question en or et « Écris PAYÉ ❤️ ».

## Comment faire l'effet « tampon » dans CapCut (exemple)
1. Mets `…-sans-tampon.png` sur la piste vidéo, pendant environ 4 secondes.
2. Ajoute `tampon-paye-avec-amour.png` en **superposition**, à la fin de ces 4 secondes.
3. Animation d'entrée du tampon : « Zoom arrière » (il arrive gros puis se pose), durée 0,3 s.
4. Au même moment : le son « ding » de caisse, puis un battement de cœur.
5. Ensuite, mets `…-fin.png` pendant 3 à 5 secondes.

👉 **Pourquoi le reçu est centré et la question sur une image à part** : sur TikTok, le bas de l'écran est caché par la légende et les boutons. Une question tout en bas ne se verrait pas.

## Faire le reçu d'une nouvelle vidéo (pour Claude)
1. Copier `recus/video-02-facture-ecole.json`, changer le titre, le numéro, la date, les lignes, le total et la question.
2. `python3 outils/marque.py` (refait les SVG).
3. `node outils/rendu-png.js` (refait les PNG). Il faut les polices Playfair Display, Montserrat et Courier Prime installées, ou une connexion internet.
