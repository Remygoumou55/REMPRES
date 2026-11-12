# Enregistrer un épisode avec OBS Studio (Windows, OBS 33)

Résultat voulu : diapos en plein écran + voix + visage dans un petit rond en bas à droite.

1. Paramètres → Vidéo : résolution de base 1920x1080, sortie 1920x1080, 30 images/s.
2. Paramètres → Sortie → Enregistrement : format MP4 (ou « MP4 fragmenté »), choisir le dossier.
3. Sources → + → « Capture d'écran » (l'écran entier).
4. Sources → + → « Périphérique de capture vidéo » (la webcam). Clic droit → Filtres → + → « Masque d'image/fusion » → type « Masque alpha (canal alpha) » → image `masque-rond-webcam.png`. Rétrécir le rond et le mettre en bas à droite.
5. Mélangeur audio : couper « Audio du bureau » (haut-parleur). Sur « Mic/Aux » : roue → Filtres → + → « Suppression du bruit ». En parlant, la barre reste dans le vert/jaune, jamais dans le rouge.
6. Enregistrer : « Démarrer l'enregistrement » → PowerPoint F5 → parler (texte sur le téléphone : `Texte-a-lire-Episode-NN.pdf`) → Échap → « Arrêter l'enregistrement ». Les vidéos : Fichier → Afficher les enregistrements.
7. Une erreur ? Ne pas arrêter : se taire 3 secondes, reprendre la phrase. Claude coupe au montage.
