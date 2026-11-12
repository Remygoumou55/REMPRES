# Couverture — image à faire avec ChatGPT (12 nov. 2026)

**Comment ça marche :** ChatGPT fait seulement **l'image, sans aucun texte**. Le titre, l'accroche et les étiquettes sont ajoutés par le script (`make-cover-bg.py` + `build-pdf-v2.py`), donc ils n'auront **jamais de faute**. L'image est fondue dans le vert de la couverture, sans ligne droite.

Pour l'instant, la couverture utilise l'illustration n° 1 (Fanta au marché) : c'est provisoire.

**Méthode :** dans la même discussion que les illustrations, envoie la planche des personnages et l'image de Fanta au marché (modèle de style), puis :

```
Crée l'image de COUVERTURE du livre, dans EXACTEMENT le même style bande dessinée que l'image jointe, avec Fanta de la planche jointe.
Format carré 1:1 (1024 × 1024). AUCUN texte, AUCUNE bulle, aucune lettre, aucun logo.
Scène : au marché, Fanta, souriante et sûre d'elle, écarte de la main un grand rideau en pagne vert profond et or, comme on ouvre une scène de théâtre. Derrière le rideau, une cliente apparaît, rassurée et heureuse, qui tient contre elle une belle robe colorée et tend la main à Fanta pour conclure. Lumière chaude et dorée de fin d'après-midi qui sort de derrière le rideau.
Composition : les personnages dans la moitié basse et au centre ; le haut de l'image est calme et sombre (vert profond #123B2F), sans détail, pour pouvoir y fondre le titre. Couleurs : vert profond #123B2F, or #B08A3E, tons chauds de pagne.
```

**Ensuite :** envoie-moi l'image. Je l'enregistre en `illustrations/cover-src.jpg`, je lance `python3 make-cover-bg.py` puis `python3 build-pdf-v2.py`, et la couverture est prête.

## Suivi (12 nov. 2026)
- 2 essais reçus. Choix : **l'essai 1 (Fanta)**, mis en place (`cover-src.jpg`). Dans l'essai 2, c'est Amina qui vend des robes au marché, alors qu'elle vend chaussures et sacs en ligne (`cover-essai-2-amina.jpg`, gardé).
- Le client veut **plus fort**. Défauts de l'essai 1 : personne ne regarde le lecteur, la scène est douce, et la poignée de main est cachée par les étiquettes. Nouveau prompt ci-dessous.

## Prompt v2 — plus fort
```
Crée une NOUVELLE image de couverture, dans EXACTEMENT le même style bande dessinée que l'image jointe, avec Fanta de la planche jointe.
Format vertical 2:3 (1024 × 1536). AUCUN texte, AUCUNE bulle, aucune lettre, aucun logo, aucune marque.
Au premier plan, au centre, Fanta en pose de héroïne : elle REGARDE LE LECTEUR droit dans les yeux, avec un sourire sûr et complice. D'un grand geste du bras, elle ouvre un immense rideau de théâtre en pagne vert profond et or.
Derrière le rideau, une lumière dorée très forte jaillit et éclaire tout : on y voit son étal plein de monde, des clientes heureuses qui repartent avec leurs robes, une cliente qui lui serre la main, un jeune homme qui paie avec son téléphone (téléphone sans marque).
Contraste fort : le côté du rideau encore fermé est sombre, le côté ouvert est lumineux et chaud. Effet spectaculaire, comme une affiche de film.
Composition : le tiers du haut est vide, uni, vert très sombre #123B2F (pour le titre). Le visage de Fanta se trouve juste en dessous, vers le milieu de l'image. Le bas de l'image reste simple (pour des étiquettes). Couleurs : vert profond #123B2F, or #B08A3E, tons chauds.
```

## Choix final (12 nov. 2026) ✅
- On garde l'**essai v2 n° 1** : Fanta regarde le lecteur, tend la main et ouvre le rideau ; derrière, le marché en lumière (poignée de main, paiement par téléphone, sacs). Fichier : `cover-src.jpg`.
- Écartés : les 2 planches à 3 cases (couverture trop chargée ; flèche de « croissance », avion et camions = promesse de richesse), et l'essai n° 3 (cercles de pagne qui flottent sur les bords, gardé en `cover-essai-3-soleil.jpg`).
- Réglages : l'image commence à 5 % du haut, l'accroche fait 132 mm de large avec une ombre, et des espaces insécables dans « … ».
