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
