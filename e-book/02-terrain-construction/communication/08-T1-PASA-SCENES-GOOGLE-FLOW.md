# T1 « La photo » — version PASA (v2) — scènes Google Flow

Voix reçue le 8 nov. 2026 : `videos/voix3/T1.mp3` (46,4 s). Le client a ajouté « sais-tu réellement », « Pour éviter ces erreurs » et « au lieu de 15000 ».
On RÉUTILISE les 9 clips déjà faits (`videos/t1/src/S1…S7`). Il manque seulement **3 nouvelles scènes : S8, S9, S10**.
Personnage : le même homme que T1 (pull gris foncé) → mettre son image en « ingrédient ».

## Minutage mesuré sur la voix
| Temps (s) | Voix | PASA | Image |
|---|---|---|---|
| 0 – 0,5 | « Arrête. » | ACCROCHE | **S8** (le pouce se fige) + gros « ARRÊTE » |
| 0,8 – 2,7 | « N'envoie plus un seul franc pour une photo. » | ACCROCHE | S8 suite + bouton « Envoyer » barré |
| 3,2 – 6,0 | « Ton frère t'écrit : le chantier avance bien, regarde. » | PROBLÈME | S1 + bulle de discussion |
| 6,4 – 8,5 | « Un mur, du ciment, des ouvriers. » | PROBLÈME | S2 (la photo), étiquettes mot par mot |
| 9,0 – 9,6 | « Alors tu paies. » | PROBLÈME | S7 (mains) + envoi d'argent animé |
| 10,1 – 13,4 | « Mais ce mur, sais-tu réellement où il est ? Il date de quand ? » | AGGRAVATION | S3 (zoom), « OÙ ? » « QUAND ? » |
| 13,8 – 16,0 | « Cette photo peut venir de n'importe quel chantier. » | AGGRAVATION | S4A, S4B, S4C en rafale |
| 16,4 – 17,8 | « Pendant que tu travailles dur là-bas, » | AGGRAVATION | **S9** (il travaille de nuit) |
| 18,1 – 20,1 | « ton argent part sur la parole d'une image. » | AGGRAVATION | motion design : billets aspirés dans la photo |
| 20,5 – 23,1 | « Et quand tu découvres la vérité, c'est souvent trop tard. » | AGGRAVATION | **S10** (le terrain vide au retour) |
| 23,5 – 29,9 | « Pour éviter ces erreurs, le guide… te montre quoi exiger avant chaque paiement : » | SOLUTION | couverture + vraies pages |
| 30,2 – 34,4 | « un appel vidéo en direct, la borne, la rue, puis les murs. » | SOLUTION | S5 (appel en direct) avec cases cochées |
| 34,8 – 37,5 | « Et le message pour demander ces preuves sans vexer personne, » | SOLUTION | S7 + vraie page du Kit 2 |
| 37,7 – 39,3 | « avec quatre kits prêts à remplir. » | SOLUTION | les 4 kits |
| 39,7 – 41,2 | « Une photo ne prouve rien. » | ACTION | S6 (il est rassuré) |
| 41,5 – 46,4 | Prix + « Clique sur le lien, avant ton prochain envoi. » | ACTION | fin motion design |

## Les 3 nouvelles scènes (prompts)
S8 — L'accroche
```
Vertical 9:16 cinematic extreme close-up, night. The same West African man in his dark grey sweater, in his small European apartment, holds his smartphone; his thumb moves toward the screen to press a button, then suddenly freezes a few millimetres above it and slowly pulls back. Tense moment, very shallow depth of field, warm lamp light and cold blue light from a rainy window, slow motion. The phone screen is softly blurred and unreadable. No text, no logos.
```
S9 — Il travaille dur là-bas
```
Vertical 9:16 cinematic shot, night. The same West African man works a night shift in a large cold warehouse in Europe, wearing a plain dark work jacket and a plain high-visibility vest without any writing. He lifts a heavy cardboard box onto a pallet, stops for a second, wipes his forehead, tired but determined. His breath is visible in the cold air. Harsh industrial lights, blue-grey tones, shallow depth of field. No text, no logos, no brand names on boxes.
```
S10 — La vérité, trop tard
```
Vertical 9:16 cinematic shot, harsh midday sun. The same West African man, now wearing a light short-sleeve shirt and carrying a travel bag on his shoulder, arrives on a plot of red earth in a West African town. There is no house: only tall dry weeds and the remains of an old, abandoned, unfinished low cement-block foundation. He stops, slowly lets the bag slide to the ground and stares in shock and disbelief. Slow push-in on his face. Warm, dusty, slightly desaturated tones. No text, no logos.
```
Nommer les fichiers `S8.mp4`, `S9.mp4`, `S10.mp4`.

## Version « image puis vidéo » (8 nov., demande du client : Flow lui donne des images)
Le personnage est décrit en entier dans chaque prompt. Étape 1 : générer l'IMAGE. Étape 2 : mettre cette image comme point de départ (« Images to Video » / « Frames to Video ») et coller le prompt d'animation.

S8 image :
```
Vertical 9:16 cinematic photo, night. Extreme close-up of a West African man, about 38 years old, short black hair, light short beard, dark grey sweater, sitting in a small cosy European apartment. He holds a smartphone in one hand, his thumb frozen just above the screen, about to press. Tense, hesitant expression, partly visible in the background. Warm lamp light mixed with cold blue light from a rainy window, very shallow depth of field. The phone screen is softly blurred and unreadable. Realistic, natural skin tones. No text, no logos.
```
S8 animation :
```
Slow motion. The man's thumb moves toward the phone screen to press, then suddenly freezes a few millimetres above it and slowly pulls back. His face tightens with doubt. Very slight camera push-in. Rain on the window behind. Keep the screen blurred and unreadable. No text, no logos.
```
S9 image :
```
Vertical 9:16 cinematic photo, night. A West African man, about 38 years old, short black hair, light short beard, working a night shift in a large cold warehouse in Europe. He wears a plain dark work jacket over a dark grey sweater and a plain high-visibility vest without any writing. He holds a heavy cardboard box, tired but determined, his breath visible in the cold air. Harsh industrial lights, blue-grey tones, shallow depth of field. Realistic. No text, no logos, no brand names on the boxes.
```
S9 animation :
```
The man lifts the heavy cardboard box onto a pallet, stops for a second, wipes his forehead with the back of his hand and breathes out a cloud of cold air. Slow handheld camera movement. Keep the vest and boxes completely blank. No text, no logos.
```
S10 image :
```
Vertical 9:16 cinematic photo, harsh midday sun. A West African man, about 38 years old, short black hair, light short beard, wearing a light beige short-sleeve shirt, a travel bag on his shoulder, standing on a plot of red earth in a West African town. In front of him there is no house: only tall dry weeds and the remains of an old, abandoned, unfinished low cement-block foundation. He stares in shock and disbelief. Warm, dusty, slightly desaturated tones. Realistic. No text, no logos.
```
S10 animation :
```
The man stands still, then slowly lets the travel bag slide from his shoulder to the ground, staring at the empty plot in shock. Dust moves in the hot wind, the dry weeds sway. Slow camera push-in on his face. No text, no logos.
```

## Contrôle des clips S8, S9, S10 (reçus le 8 nov.)
- S8 (pouce qui se fige) : très bon. Pas de texte. Téléphone sans logo visible.
- S9 (entrepôt) : bon. Gilet sans écriture. Petites étiquettes illisibles sur les étagères → recadrage léger au montage.
- S10 (terrain vide) : très bon. Le sac est posé vite (1re seconde) ; le visage choqué de 3 à 9 s est parfait.
- **Problème :** Flow a créé un homme plus âgé, AVEC LUNETTES, différent de l'homme des anciens S1/S6 (sans lunettes). Pour garder UN seul personnage : refaire **S1b** (le message arrive) et **S6b** (rassuré pendant l'appel vidéo) avec l'homme à lunettes, en partant des images `videos/t1/ref/depart-S1b.jpg` et `depart-S6b.jpg` (tirées de S8). S7 (mains seules) reste.

S1b animation (image de départ : depart-S1b.jpg)
```
Night, cosy European apartment, rain on the window. The phone in the man's hands lights up with a new message. He reads it, and a small hopeful smile appears on his face. Slow camera push-in, shallow depth of field. Keep the phone screen blurred and unreadable. No text, no logos.
```
S6b animation (image de départ : depart-S6b.jpg)
```
Night, cosy European apartment, rain on the window. The man raises his phone in front of him at arm's length, as in a live video call; the light of the screen falls on his face. He watches very carefully, then slowly nods and breathes out, relieved, with a calm smile. The phone screen faces away from the camera. Shallow depth of field. No text, no logos.
```
