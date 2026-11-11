# Allègement de la version longue (226 p.) vers environ 150 pages — règles de travail (décision du client « B », 11 nov. 2026)

Objectif : passer d'environ 105 000 mots à **environ 68 000 à 72 000 mots**, **sans perdre une seule idée**.
Le travail se fait chapitre par chapitre, dans `manuscrit-v2/`.
Avancement : voir le tableau en bas. Après chaque groupe de chapitres : rebuild (`python3 build-pdf-v2.py`, il faut `pip install markdown`), commit et push.

## Règles par chapitre
1. **Supprimer** l'encadré « Dans ce chapitre, tu vas apprendre/comprendre » (il revenait 23 fois). Le remplacer, si besoin, par une seule phrase variée dans l'accroche.
2. **Scènes d'ouverture :** **2 au maximum**, les plus parlantes et de profils différents. Si un quiz ou un passage renvoie à « l'exemple 3 », adapter le renvoi.
3. **« Tu as remarqué ? » :** 3 à 4 phrases au maximum.
4. **Quiz :** 1 ou 2 par chapitre, avec **une seule bonne réponse**. On garde « Pourquoi pas A / B » et « La bonne action ».
5. **Témoignages réels :** 1 ou 2 par chapitre, jamais le même deux fois dans le livre. On les garde mot pour mot.
6. **Banques de phrases, longues listes de répliques, scripts complets :** ils vont dans `kits/A-AJOUTER-DEPUIS-V2.md`, pour être intégrés aux kits. Dans le chapitre, on en garde 3 ou 4, les meilleures.
7. **« Entraîne-toi » :** 1 encadré, 2 exercices au maximum. On garde la « réponse possible » si elle est utile.
8. **Fin de chapitre :** UN seul encadré « À retenir », qui contient la checklist (5 points au maximum), « ⚠️ L'erreur à éviter » (1 phrase) et « ➡️ Et maintenant ? » (1 ou 2 phrases). On supprime les encadrés séparés `erreur` et `suite` de fin de chapitre : ce sont eux qui laissaient des pages presque vides.
9. On garde « Les mots à connaître » (3 ou 4 mots) et « Dans ta situation » (une ligne par profil).
10. **Phrases :** pas plus de 20 à 25 mots. Une phrase longue est coupée en deux.
11. **Chiffres :** chaque chiffre apparaît une seule fois dans le livre (là où il est le plus utile). Ailleurs, on écrit « tu l'as vu au chapitre X ».
12. **Pelissier :** on le cite pour créditer une idée, pas plus. On ne garde pas d'anecdote personnelle longue (une phrase suffit). On ne met jamais son nom dans la pub.
13. **Rien d'inventé :** on ne crée pas de nouveau chiffre ni de nouveau témoignage.

## Avancement
| Ch. | Mots avant | Mots après | État |
|---|---|---|---|
| 0 | 1894 | 967 | ✅ |
| 1 | 3137 | 1842 | ✅ |
| 2 | 3459 | 2172 | ✅ |
| 3 | 3731 | 2321 | ✅ |
| 4 | 2812 | 1860 | ✅ |
| 5 | 3516 | 2062 | ✅ |
| 6 | 4135 | 2009 | ✅ |
| 7 | 4148 | 2086 | ✅ |
| 8 | 4543 | 2192 | ✅ |
| 9 | 4058 | 2134 | ✅ |
| 10 | 4473 | 2463 | ✅ |
| 11 | 4271 | 2377 | ✅ |
| 12 | 4352 | 2182 | ✅ |
| 13 | 3665 | 1972 | ✅ |
| 14 | 3580 | 2187 | ✅ |
| 15 | 3528 | 1925 | ✅ |
| 16 | 4226 | 2215 | ✅ |
| 17 | 4240 | 2117 | ✅ |
| 18 | 5179 | 2792 | ✅ |
| 19 | 3705 | 2058 | ✅ |
