# Formation en ligne « Ne laisse plus partir tes clients » (PowerPoint)

- Base : le plan en 40 épisodes du client (`Formation_Art_du_Closing_40_episodes.pptx`), refait aux couleurs du livre, avec les images BD.
- **Tout le texte à dire est dans les notes du présentateur** de chaque diapositive (mode présentateur : le formateur voit ses notes, les élèves voient seulement la diapo).
- Chaque épisode : couverture · contenu · quiz ou exemple · exercice en direct (chat) · « À retenir » + devoir + prochain épisode.
- Générateur : `src/build.js` (pptxgenjs), un fichier par épisode (`src/ep00.js`, `ep01.js`…).
  `NODE_PATH=<node_modules avec pptxgenjs> node src/build.js ep00 ep01 ep02 sortie.pptx` (lancer depuis `src/`).
- 12 nov. 2026 : échantillon épisodes 00 à 02 (`Formation-Episodes-00-a-02-ECHANTILLON.pptx`), en attente de validation du client.
- Client a choisi l'option A : épisodes de 8 à 12 min, les longs sont coupés en deux.
- Partie 1 — `Partie-1-Comprendre-Episodes-00-a-11.pptx` (épisodes 00 à 11, livre ch. 0 à 5).
- Partie 2 — `Partie-2-Methode-RIDEAU-Episodes-12-a-23.pptx` (épisodes 12 à 23, livre ch. 6 à 11, 128 diapos) : R, I ×2, D ×2, É ×2, A ×2, U ×2 + fiche RIDEAU. Validée (validate.py) et contrôlée visuellement.
- À faire : partie 3 (situations difficiles, ch. 12 à 18), partie 4 (canaux, ch. 19 à 25), partie 5 (ch. 26 à 28 + épisode final).
