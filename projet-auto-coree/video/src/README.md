# Monter une vidéo pour une nouvelle voiture

1. Mettre les photos (plaques floutées) dans `../../photos/`.
2. Modifier `scenes.json`, avec une entrée par scène :
   - `photo` : le nom du fichier photo ;
   - `tag` : le badge ;
   - `title` et `text` : le titre et le texte ;
   - `dur` : la durée en secondes ;
   - `pan` : le mouvement de caméra (`left`, `right`, `up` ou `down`) ;
   - `full: true` : une carte plein écran, sans photo.
3. Générer les calques texte : `node overlays.js`
4. Monter la vidéo : `python3 build.py`. Le résultat est `../demo-corolla-tiktok.mp4` (renommer ensuite).

Il faut avoir installé ffmpeg, Node avec Playwright, et la police Inter.
Pour ajouter la voix off et la musique, ouvrir le MP4 dans CapCut.
