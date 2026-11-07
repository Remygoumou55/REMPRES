# RAPPORT COMPLET ET PASSATION — Livre 2 « Terrain et construction » (état au 7 nov. 2026, 20 h 30)

> **Agent qui reprend : lis ce fichier en entier AVANT de répondre au client.** Il résume tout ce qui a été fait et décidé avec le client sur le livre 2 : livre, kits, ZIP, étude de marché, prix et vidéos. Il dit aussi **exactement** où on s'est arrêté et comment continuer.
> L'historique mot pour mot de nos échanges est dans `e-book/00-projet/conversations/HISTORIQUE-CONVERSATIONS.md` (jusqu'au 7 nov., 2 h 18) et dans `HISTORIQUE-CONVERSATIONS-SUITE.md` (de 2 h 18 jusqu'à la fin).

---

## 0. Le client et sa façon de travailler (à respecter absolument)
- **Langue :** il parle en français, tutoie, dit « mec » et lit sur son **téléphone**.
  - Réponds-lui en **français très simple**, avec **tout le détail dans le chat** : pas seulement un lien vers un fichier.
  - Quand il demande « donne-moi les scripts / prompts ici », mets **chaque texte dans un bloc de code séparé**, pour qu'il puisse le copier d'un geste.
- **Sauvegarde après CHAQUE étape (il l'exige) :**
  1. mettre à jour `e-book/README.md` (sections 2 et 3) et les fichiers du livre ;
  2. faire un commit ;
  3. `git push origin HEAD:main` ;
  4. `git push origin HEAD:claude/livres-ebooks-transformation-7t016a` ;
  5. pousser aussi sur la branche de session si on t'en donne une.
- **Ne touche à rien en dehors de `e-book/`.** Le reste du dépôt, c'est son application.
- **Il est exigeant et direct.** Il a refusé les 6 premières vidéos avec des mots durs (section 6). Ne te défends pas : reconnais le problème, corrige, et montre le résultat.
- **Il génère lui-même :**
  - les **voix off** sur ElevenLabs, voix « Hugo – Serious and Professional » ;
  - les **scènes vidéo** sur **Google Flow**.
  - Il te les envoie en pièces jointes. Les fichiers arrivent dans `/root/.claude/uploads/<id-de-session>/` et sont nommés par Flow, par exemple `Man_picking_up_phone_xxxx.mp4`. Tu dois retrouver à quelle scène correspond chaque fichier.
  - **Un fichier envoyé pendant que tu travailles n'arrive pas.** Demande-lui de le renvoyer dans un nouveau message.
- **Il envoie souvent les scènes par paquets de 5.** Vérifie chaque paquet : regarde les images, note les défauts, puis dis-lui lesquelles manquent encore.

## 1. Les règles du contenu (valables aussi pour les vidéos)
- **RÈGLE N°1 — faits réels anonymes.** Le client n'a pas les moyens de payer un avocat.
  - Jamais de pays, de ville, de nom, de montant exact ni de journal pour une affaire réelle.
  - Aucune démolition ni décision d'État nommée. Pas de politique.
- **Tout doit être vrai.** On ne met rien dont on n'est pas sûr. Pas de prix de matériaux (fer, ciment, briques) ni de prix de journée de maçon : c'est la décision du client.
- **Mots interdits :** « garanti », « zéro risque », « devenir riche ». Pas de faux témoignage.
  - Mamadou et Aïcha sont des **personnages du livre**. On le dit, par exemple « son histoire ressemble à beaucoup d'autres » ou « dans le guide, tu suis Mamadou ».
- **Dans les pubs, ne jamais dire le nombre de pages.**
- **Prix choisi : 12 900 F CFA**, pour le livre + 4 kits.
  - Le client a ajouté **« au lieu de 15 000 »** dans les voix T1 et T2. Je l'ai prévenu : ce n'est honnête que si 15 000 F est vraiment le prix après le lancement, avec une **vraie date de fin**. Sinon c'est un faux prix barré : Meta peut refuser la pub, et c'est interdit pour la clientèle en France.
  - **Il n'a pas encore répondu.** Repose-lui la question avant de lancer la pub.
- **Adresse e-mail :** garder « [adresse e-mail à ajouter] » dans le livre. Le client donnera son Gmail plus tard ; il a dit d'attendre.

## 2. Le livre 2 — terminé (version 1.0)
- **Titre :** « Acheter un terrain et construire au pays sans te faire arnaquer ».
- **Contenu :**
  - 20 chapitres en 6 parties ;
  - « L'essentiel en 10 minutes » au début ;
  - 7 fiches pays (Guinée, Côte d'Ivoire, Sénégal, Cameroun, Bénin, Gabon, Togo) ;
  - un lexique de 87 mots ;
  - les mentions et le plan de mise à jour ;
  - 9 images générées par le client.
- **Pages :**
  - A4 : **150 pages**. C'est le maximum demandé par le client ; ne pas dépasser.
  - Téléphone : environ 278 pages.
- **4 kits :** 1 checklists, 2 modèles, 3 calculs, 4 carnets. Le Kit 0 a été retiré, il faisait doublon avec le résumé.
- **ZIP :** 2 dossiers, « Version ordinateur (imprimable) » et « Version telephone ».
- **Où sont les fichiers :**
  - sources : `livre/src/book/*.html` et `livre/src/bonus/kit-*.html` ;
  - PDF et ZIP : `livre/dist/`.
- **Construire :**
  - A4 : `node e-book/02-terrain-construction/livre/build.mjs`
  - téléphone : `PHONE=1 node e-book/02-terrain-construction/livre/build.mjs`
  - ZIP : `bash e-book/02-terrain-construction/livre/make-zip.sh`
  - contrôle des pages : `python3 livre/controle-pages.py fichier.pdf dossier`
- **Le détail est ailleurs :**
  - `livre/README.md` ;
  - `CRITIQUE-SEVERE-LIVRE.md` (critique et corrections) ;
  - `livre/PROMPTS-IMAGES.md` (les 9 images).
- **Reste à faire sur le livre :**
  - mettre l'adresse Gmail dans `src/book/01-intro.html` et `src/book/80-mentions.html`, puis reconstruire et refaire le ZIP ;
  - faire relire les fiches pays par un notaire ou un juriste avant la vente (conseil).

## 3. Étude de marché (faite le 7 nov.)
Les fichiers sont dans `marketing/` : `M1_concurrence.md`, `M2_cibles_pays.md`, `M3_voix_et_accroches.md`, `M4_canaux_prix_campagne.md` et **`SYNTHESE-MARKETING.md`** (à lire).

En bref :
- **Concurrence :** presque aucun concurrent payant en français. Le vrai concurrent, c'est le contenu gratuit (YouTube).
- **Cibles :**
  - n°1 en valeur : la diaspora en France, à toucher gratuitement puis par reciblage ;
  - n°1 en publicité payante : les acheteurs sur place en Côte d'Ivoire, puis au Cameroun et au Sénégal.
- **Canaux :** pub Meta qui ouvre WhatsApp, et TikTok en gratuit.
- **Plan de lancement :** environ 150 000 F de pub sur 5 semaines.
- **Accroches gardées :** voir la section 7 de la synthèse. On a écarté celles qui citent un lieu, un montant ou un prix de matériau.
- **Le client doit encore vérifier** (section 8 de la synthèse) :
  - le paiement Chariow (Guinée, carte depuis la France) ;
  - le pixel Meta ;
  - comment payer la pub Meta depuis la Guinée ;
  - le ciblage « Expats ».

## 4. Les vidéos — historique
### 4.1 Version 1 (V1 à V6) : REFUSÉE par le client
- **Fichiers :** `videos/V1-…mp4` à `V6-…mp4`, moteur `videos/gen.py`, `engine.js`, `render.mjs`, `music.py`, voix `videos/voix/T1…T6.mp3`. On les garde seulement comme archive. **Ne pas les réutiliser.**
- **Ce que le client a dit** (le 7 nov., message entier dans l'historique) : « complètement nulles », « rien n'est bon », « on dirait une même vidéo dupliquée ». Ses reproches :
  1. les 6 vidéos se ressemblent toutes : **même fond, mêmes couleurs, même musique, mêmes bruitages, mêmes transitions** ;
  2. **le texte est presque identique** d'une vidéo à l'autre : chaque voix redisait « Acheter un terrain et construire au pays… » et « Le guide te montre… » ;
  3. **la voix et l'image ne sont pas synchronisées** ;
  4. le design est générique, ça ne peut pas vendre, et Facebook n'aime pas ça ;
  5. **on ne voit pas les pages du livre** ;
  6. pas de vrai motion design captivant.
- **Ce qu'il exige :**
  - chaque vidéo **unique et authentique**, avec sa musique, ses bruitages, ses designs, ses couleurs de fond et son histoire ;
  - **une synchronisation parfaite** entre la parole et l'image ;
  - **les vraies pages du livre** à l'écran ;
  - **on ne doit rien voir dans une vidéo qu'on retrouve dans une autre.**

### 4.2 Version 2 : la méthode qui marche
1. **Nouveaux scripts.** Un format différent par vidéo, dans `communication/03-NOUVEAUX-SCRIPTS-6-VIDEOS.txt`.
   - Les phrases sont séparées par `<break time="0.7s" />`, ce qui crée une vraie pause pour caler les images.
   - Un seul fichier mp3 par vidéo.
   - **Le client modifie parfois le texte en enregistrant.** En T1 et T2, il a ajouté « au lieu de 15000. commander maintenant », et en T2 le titre du livre. **Mesure toujours sur sa vraie voix, pas sur le script.**
2. **Mesurer la voix :**
   `ffmpeg -i voix.mp3 -af silencedetect=noise=-38dB:d=0.07 -f null - 2>&1 | grep silence_`
   Ensuite, associe chaque morceau de parole (entre deux silences) à une phrase, et note les temps.
3. **Écrire pour le client les scènes Google Flow,** avec le minutage. Le modèle à suivre est dans `04-T1-SCENES-GOOGLE-FLOW.md` et `05-T2-SCENES-GOOGLE-FLOW.md`.
   - Prompts **en anglais**, format portrait 9:16, « No text, no logos ».
   - D'abord des **images de personnages** que le client met en « ingrédient » dans Flow, pour garder le même visage partout.
   - Une scène par phrase, ou plusieurs plans rapides pour une énumération.
   - Les clips de Flow font 10 s, en 720×1280, à 24 images par seconde.
4. **Contrôler chaque clip :**
   - faire une planche d'images à raison d'une par seconde : `ffmpeg -i clip.mp4 -vf "fps=1,scale=180:-1,tile=8x1" -frames:v 1 planche.jpg` ;
   - chercher les faux textes et les logos (sacs de ciment, écrans) et les défauts (dans T1, la scène S3 avait un « cadre dans le cadre » pendant les 4 premières secondes : on a pris la suite).
   - Si un sac de ciment porte des lettres, **recadre** plutôt que de flouter : un flou carré, c'est moche.
5. **Montage** dans un dossier par vidéo (`videos/t1/`, `videos/t2/`), avec les mêmes outils mais un **design entièrement nouveau** à chaque fois :
   - `src/` : les clips Flow, renommés S1.mp4, S2.mp4…
   - `fr/<scène>/0001.jpg…` : les images extraites à 30 im/s, en 1080×1920. Ce dossier n'est pas sur git ; on le refait avec :
     `ffmpeg -ss DEBUT -t DUREE -i src/S1.mp4 -vf "fps=30,scale=1080:1920:flags=lanczos,unsharp=5:5:0.5" -q:v 3 fr/S1/%04d.jpg`
     (les débuts et durées utilisés sont dans le tableau `N` et les fonctions `pw()` de `index.html`) ;
   - `index.html` : une page de 1080×1920 avec une fonction `window.render(t)` qui place tout selon le temps : clips (images), textes, motion design, sous-titres mot par mot ;
   - `render.mjs` : `node render.mjs preview 1.0 4.2 …` fait des captures pour contrôler ; `node render.mjs` fait la vidéo muette `video-muette.mp4`. Compte environ **10 à 12 minutes pour 40 s** ;
   - `audio.py` : **musique et bruitages originaux** générés avec numpy et scipy (`pip install scipy` si besoin), qui donnent `music.wav` et `sfx.wav`. Chaque vidéo a son propre style, sa tonalité, son tempo et ses bruitages, tous placés au temps exact de l'image ;
   - mixage final (voix + musique baissée sous la voix + bruitages) :
     ```
     ffmpeg -y -i ../voix2/TN.mp3 -i music.wav -i sfx.wav -filter_complex "[0:a]aresample=44100,aformat=channel_layouts=stereo,apad=whole_dur=DUREE,asplit=2[v][k];[1:a]volume=0.30[m];[m][k]sidechaincompress=threshold=0.025:ratio=5:attack=30:release=400[md];[2:a]volume=0.55[s];[v][md][s]amix=inputs=3:normalize=0,alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=9[a]" -map "[a]" -t DUREE -c:a pcm_s16le mix.wav
     ffmpeg -y -i video-muette.mp4 -i mix.wav -map 0:v -map 1:a -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest ../TN-nom.mp4
     ```
     Prends **crf 23 ou 24** pour rester sous 50 Mo : GitHub prévient au-delà de 50 Mo (T1 fait 51 Mo et T2 56 Mo).
   - **On ne peut pas écouter le son.** Mesure les niveaux (RMS de la musique entre −25 et −30 dB, voix autour de −21 dB) et dis honnêtement au client que c'est lui qui juge à l'oreille.
6. **Avant d'envoyer :**
   - contrôler 6 à 8 images de la vidéo finale ;
   - commit et push ;
   - envoyer la vidéo au client avec la liste des scènes et de ce qu'on voit, en français simple ;
   - lui demander son avis scène par scène.

## 5. Où on en est EXACTEMENT
| Vidéo | Format | Voix | Scènes Flow | Montage | État |
|---|---|---|---|---|---|
| **T1 « La photo »** | discussion sur téléphone, de nuit | ✅ `videos/voix2/T1.mp3` (31,9 s) | ✅ 9 clips, `videos/t1/src/` | ✅ `videos/T1-la-photo.mp4` (33,4 s) | **Envoyée. Avis du client pas encore reçu.** |
| **T2 « Mamadou »** | petit film (Europe froide / pays doré) | ✅ `videos/voix2/T2.mp3` (41,9 s) | ✅ 15 clips, `videos/t2/src/` | ✅ `videos/T2-mamadou.mp4` (43,4 s) | **Envoyée. Avis du client pas encore reçu.** À vérifier : la voix dit-elle bien « arnaquer » dans le titre ? Le texte collé par le client disait « ANARQUER ». |
| **T3 « Deux acheteurs »** | enquête | ⏳ à enregistrer par le client | ⏳ prompts à écrire | — | prochaine |
| **T4 « Le classement des papiers »** | classement / escalier | ⏳ | ⏳ | — | |
| **T5 « Le maçon »** | quiz télé | ⏳ | ⏳ | — | |
| **T6 « Dix minutes »** | chrono | ⏳ | ⏳ | — | |

**LA PROCHAINE ACTION EXACTE :**
1. Demander au client son avis sur T1 et T2, et corriger ce qu'il demande. Les fichiers `index.html` et `audio.py` de chaque dossier permettent de tout refaire.
2. Lui reposer deux questions :
   - « au lieu de 15 000 » : est-ce le vrai prix après le lancement, et quelle est la date de fin de l'offre ?
   - la prononciation de « arnaquer » dans T2.
3. **T3** : quand le client envoie `T3.mp3`, mesurer les phrases, puis écrire `06-T3-SCENES-GOOGLE-FLOW.md` (personnages + scènes + minutage, prompts dans des blocs de code), comme pour T1 et T2. Le client génère les scènes, puis on fait le montage dans `videos/t3/`. Même chose pour T4, T5 et T6.

## 6. Ce qui rend chaque vidéo unique (NE PAS RÉPÉTER)
**Déjà utilisé, donc interdit dans les autres vidéos :**
- **T1 :**
  - fond vert nuit `#06120E`, menthe `#3DDC97`, ambre `#FFB020` ;
  - police Inter et Inter Display Black ;
  - notifications, discussion, photo avec étiquettes, « OÙ ? / QUAND ? », galerie de 4 chantiers, écran d'appel vidéo avec cases cochées, page du Kit 2 surlignée ;
  - sous-titres blancs avec le mot en cours sur un fond menthe ;
  - fin sur fond sombre avec un bouton ambre ;
  - musique : pluie, piano électrique en ré mineur, tension, puis rythme doux en fa majeur à 92 bpm.
- **T2 :**
  - film avec bandes noires, grain, lumières orange ;
  - couleurs crème `#FFF4E0`, terre cuite `#C4572B`, or `#E8B04B`, brun `#2A150B` ;
  - police serif Caladea, sous-titres qui apparaissent mot par mot avec les mots clés en or et en italique ;
  - titre « MAMADOU », étiquettes des mois, tampons rouges, note vocale, « DÉJÀ VENDU », 3 étiquettes, pages qui tournent, 3 clés, illustration des 3 mains ;
  - fin sur **fond clair** avec un bouton terre cuite ;
  - musique : cordes pincées façon kora en la mineur à 80 bpm, battement de cœur, boîte à musique, puis espoir en do majeur.

**Proposition pour la suite** (à présenter au client) :
- **T3 Deux acheteurs (enquête) :**
  - noir, rouge `#D7263D` et papier kraft ; police JetBrains Mono et Anton (fichier `assets/anton.woff2`) ;
  - dossier d'enquête avec photos épinglées et fil rouge, deux reçus côte à côte, loupe, 12 cases qui se cochent une par une (la vraie checklist du Kit 1) ;
  - musique sombre et pulsée, style thriller, à 100 bpm ; bruitages : machine à écrire, tampon, appareil photo, coups sourds.
- **T4 Classement :**
  - jaune vif `#FFD23F`, bleu nuit, blanc ; police Montserrat 900 et Poppins (`assets/mont-900.woff2`, `pop-800.woff2`) ;
  - escalier 3D de 6 marches, chaque papier posé sur sa marche, la marche 6 qui brille ; la **vraie page de l'escalier** (chapitre 3) ;
  - musique joyeuse au marimba à 120 bpm ; un « pop » montant à chaque marche.
- **T5 Le maçon (quiz télé) :**
  - jaune et noir chantier, texture béton ;
  - boutons A et B, chronomètre de jeu, buzzer « faux », son « bonne réponse » ;
  - échéancier qui monte (fondations, murs, dalle) ; **la vraie page du contrat du maçon** (Kit 2) ;
  - musique percussive de chantier à 116 bpm.
- **T6 Dix minutes (chrono) :**
  - blanc pur et orange `#E2650C`, très épuré ; Inter Thin et Inter Black ;
  - un grand chrono 10:00 qui défile ; les **vraies pages de « L'essentiel en 10 minutes »** (pages 8 et 9 du PDF téléphone, déjà dans `videos/assets/page-8.png` et `page-9.png`) ;
  - musique électro rapide à 128 bpm avec un tic-tac, et une sonnerie à la fin.

## 7. Les scripts T3 à T6 (texte prévu, à copier dans ElevenLabs)
Ils sont aussi dans `03-NOUVEAUX-SCRIPTS-6-VIDEOS.txt`. Le client peut les modifier, par exemple en ajoutant « au lieu de 15000. Commander maintenant. ».

**T3 – DEUX ACHETEURS**
```
Deux familles. Un seul terrain. Et les deux ont un reçu. <break time="0.7s" /> Qui est le propriétaire ? Peut-être... aucune des deux. <break time="0.7s" /> Un reçu prouve que tu as payé. Il ne prouve pas que le vendeur avait le droit de vendre. <break time="0.7s" /> Avant de payer un seul franc, il y a douze vérifications à faire. <break time="0.7s" /> Au bureau foncier. Chez ton notaire. Avec ton géomètre. Et chez les voisins. <break time="0.7s" /> Les douze sont dans le guide, en liste à cocher. Avec la fiche de ton pays, parmi sept pays. <break time="0.7s" /> Vérifie avant, pas après. Douze mille neuf cents francs, le guide et ses quatre kits.
```
**T4 – LE CLASSEMENT DES PAPIERS**
```
Les papiers de terrain, classés du plus faible au plus solide. <break time="0.7s" /> Tout en bas : le simple reçu. Il prouve un paiement. C'est tout. <break time="0.7s" /> Ensuite : l'attestation du quartier ou du village. Utile, mais ce n'est pas un papier de l'État. <break time="0.7s" /> Plus haut : la lettre d'attribution, puis les papiers intermédiaires. Ce sont des étapes, pas encore la propriété. <break time="0.7s" /> Puis le titre foncier au nom du vendeur. <break time="0.7s" /> Et tout en haut, la seule marche qui fait de toi le propriétaire : le titre à TON nom. <break time="0.7s" /> Le guide te donne cet escalier complet, pays par pays. Douze mille neuf cents francs, avec les quatre kits.
```
**T5 – LE MAÇON**
```
Ton maçon te demande une grosse avance avant de commencer. Tu fais quoi ? <break time="0.7s" /> Réponse A : tu paies, il faut bien qu'il démarre. Réponse B : tu paies étape par étape. <break time="0.7s" /> La bonne réponse, c'est B. Avec une grosse avance, tu perds ton seul moyen de pression. <break time="0.7s" /> Une petite somme pour démarrer. Puis tu paies chaque étape finie : les fondations, les murs, la dalle. Toujours après la preuve. <break time="0.7s" /> Et le fer, tu le paies directement au fournisseur. Pas au maçon. <break time="0.7s" /> Le modèle de contrat avec le maçon est prêt à remplir, dans le guide. <break time="0.7s" /> Paie ce qui est fait, pas ce qui est promis. Le guide et ses quatre kits : douze mille neuf cents francs.
```
**T6 – DIX MINUTES**
```
Tu vas acheter un terrain ? Donne-moi dix minutes avant. <break time="0.7s" /> D'abord, les trois règles d'or. Vérifie avant de payer. Jamais tout dans une seule main. Pas de papier, pas de paiement. <break time="0.7s" /> Ensuite, le seul papier vraiment solide, pays par pays. <break time="0.7s" /> Et les dix phrases qui doivent t'arrêter net. Par exemple : « Il faut payer aujourd'hui, d'autres acheteurs attendent. » <break time="0.7s" /> C'est « L'essentiel en dix minutes », au tout début du guide. <break time="0.7s" /> Puis tout le détail, étape par étape, avec les kits prêts à remplir. <break time="0.7s" /> Dix minutes maintenant, ou des années de problèmes après ? Douze mille neuf cents francs.
```
Chaque phrase a été vérifiée avec le livre :
- les 12 vérifications sont au chapitre 4 et dans le Kit 1 ;
- l'escalier des 6 marches est au chapitre 3 (le PDF téléphone a une page avec l'escalier dessiné) ;
- « une petite somme pour démarrer, puis chaque étape après preuve » est au chapitre 15, et le contrat du maçon est dans le Kit 2 ;
- les 3 règles d'or et les 10 phrases sont dans « L'essentiel en 10 minutes ».

## 8. Les vraies pages du livre à montrer
Pour trouver une page dans le PDF téléphone, on cherche son numéro dans le texte :
```
python3 -c "import subprocess;o=subprocess.run(['pdftotext','e-book/02-terrain-construction/livre/dist/Terrain-et-construction-telephone.pdf','-'],capture_output=True,text=True).stdout;[print(i+1) for i,p in enumerate(o.split('\f')) if 'MOT CHERCHÉ' in p]"
```
Pour l'exporter en image :
```
pdftoppm -f N -l N -png -scale-to-x 1000 -scale-to-y -1 fichier.pdf sortie
```
Pages déjà repérées dans le PDF téléphone :

| Page(s) | Contenu |
|---|---|
| 26, 108, 203 | cas de Mamadou |
| 224 | « Mamadou, un an après » |
| 107 | les 3 clés (illustration) |
| 8 et 9 | « L'essentiel » |

Kit 2 (téléphone) : la page 5 est le « Message pour demander les preuves ». La couverture est `videos/t1/cover.jpg`. Les images du livre sont dans `videos/assets/img1…9.jpg`.

## 9. Autres travaux en attente (après les vidéos)
- Les visuels fixes (affiches) et la page de vente (Chariow).
- Une variante des vidéos qui finit par « Écris TERRAIN sur WhatsApp », pour les 2 semaines de publications gratuites du plan de lancement. Je l'ai proposée ; le client n'a pas encore répondu.
- L'adresse Gmail, puis reconstruire le livre et refaire le ZIP.
- Les points à vérifier par le client (Chariow, Meta).
- Ensuite : le livre 3 (élevage de poulets), puis le livre 4 (entreprise et financement).

## 10. Pièges techniques déjà rencontrés
- Sur le réseau de la session, curl et WebFetch étaient bloqués (403). L'outil WebSearch marchait. PyPI marchait (`pip install scipy`).
- Les commandes d'attente en arrière-plan s'arrêtent au bout de 20 minutes. Le rendu continue quand même : vérifie `render.log`, qui écrit « ok » à la fin.
- Dans `index.html`, deux classes CSS portant le même nom (`.hl`) ont caché un texte dans T1. Donne des noms uniques.
- Les polices installées sont Inter, Inter Display, JetBrains Mono, Caladea, Liberation Serif et Noto Color Emoji. Il y a aussi des woff2 dans `videos/assets/` (Anton, Montserrat, Poppins), à charger avec `@font-face`.
- Ne pas mettre `fr/`, `pv/`, `frames/` ni `*.wav` sur git : chaque dossier vidéo a son `.gitignore`.
