# Formation en ligne « Ne laisse plus partir tes clients » (PowerPoint)

- Base : le plan en 40 épisodes du client (`Formation_Art_du_Closing_40_episodes.pptx`), refait aux couleurs du livre, avec les images BD.
- **Tout le texte à dire est dans les notes du présentateur** de chaque diapositive (mode présentateur : le formateur voit ses notes, les élèves voient seulement la diapo).
- Chaque épisode : couverture · contenu · quiz ou exemple · exercice en direct (chat) · « À retenir » + devoir + prochain épisode.
- Générateur : `src/build.js` (pptxgenjs), un fichier par épisode (`src/ep00.js`, `ep01.js`…).
  `NODE_PATH=<node_modules avec pptxgenjs> node src/build.js ep00 ep01 ep02 sortie.pptx` (lancer depuis `src/`).
- 12 nov. 2026 : échantillon épisodes 00 à 02 (`Formation-Episodes-00-a-02-ECHANTILLON.pptx`), en attente de validation du client.
