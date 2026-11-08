# Partie 9 : Excel pour la mine, du débutant à l'avancé

> Ton CV dit « maîtrise Excel ». Cette partie te permet de le rendre **vrai à 100 %**.
> Le fichier d'exercices est [`excel/Exercices_Excel_Mine_Remy.xlsx`](excel/Exercices_Excel_Mine_Remy.xlsx). Ouvre-le dans Excel, dans Google Sheets ou dans WPS Office sur ton téléphone.
>
> **Règle** : les cases **jaunes** sont à remplir avec une **formule**. Ne tape jamais le résultat à la main. Ne regarde la feuille « Corrigé » qu'après avoir essayé.

---

## 1. Ce qu'on utilise vraiment dans les mines

| Niveau | Ce qu'il faut savoir faire | À quoi ça sert dans une mine |
|---|---|---|
| **1. Débutant** | Saisir des données, mettre en forme un tableau, `SOMME`, `MOYENNE`, `MAX`, `MIN` | Feuille de présence, heures de l'équipe |
| **2. Bases solides** | Calculs (+ − × ÷), pourcentages, références `$A$1`, trier, filtrer, mise en forme conditionnelle, `SI` | Production par camion, disponibilité, comparaison avec l'objectif |
| **3. Intermédiaire** | `NB.SI`, `SOMME.SI`, `MOYENNE.SI`, `SIERREUR` | Carburant par engin, nombre de pannes, total par opérateur |
| **4. Avancé** | `RECHERCHEV` (ou `RECHERCHEX`), `SOMME.SI.ENS`, `NB.SI.ENS`, validation des données (listes déroulantes) | Aller chercher le modèle d'un engin, faire un total par date **et** par poste |
| **5. Chef d'équipe** | Tableau croisé dynamique, graphiques, modèle de rapport de poste automatique, impression propre (mise en page) | Rapport de poste, résumé de la semaine pour le superviseur |

👉 **Pour un chef d'équipe, les niveaux 1 à 4 sont indispensables. Le niveau 5 te rendra meilleur que les autres.**

**Les noms des formules en français et en anglais** (beaucoup de mines ont Excel en anglais) :

| Français | Anglais |
|---|---|
| SOMME | SUM |
| MOYENNE | AVERAGE |
| MAX / MIN | MAX / MIN |
| NB / NBVAL | COUNT / COUNTA |
| SI | IF |
| NB.SI / NB.SI.ENS | COUNTIF / COUNTIFS |
| SOMME.SI / SOMME.SI.ENS | SUMIF / SUMIFS |
| MOYENNE.SI | AVERAGEIF |
| RECHERCHEV | VLOOKUP |
| SIERREUR | IFERROR |

⚠️ En français, on sépare les éléments d'une formule avec un **point-virgule ;**. En anglais, avec une **virgule ,**.

---

## 2. Les exercices (feuille par feuille)

### NIVEAU 1 : feuille `N1_Presences` (heures de l'équipe)
- **1.1** En I4, calcule le total d'heures de Camara pour la semaine : `=SOMME(B4:H4)`. Recopie la formule vers le bas jusqu'à I13 (tire le petit carré en bas à droite de la case).
- **1.2** Ligne 14 : le **total** de chaque jour.
- **1.3** Ligne 15 : la **moyenne** de chaque jour.
- **1.4** Lignes 16 et 17 : le **maximum** et le **minimum**.
- **1.5** Mise en forme : titres en gras, bordures, colonnes bien larges, nombres centrés.
- **1.6 (bonus)** En K4:K13, écris « Repos » si l'opérateur a 0 heure le dimanche, sinon « Travaillé » (fonction `SI`).

### NIVEAU 2 : feuille `N2_Production` (production des camions)
- **2.1** Colonne I (tonnes totales) = voyages × tonnes par voyage.
- **2.2** Colonne J (disponibilité) = heures de marche ÷ (heures de marche + heures de panne). Mets la colonne au format **%**.
- **2.3** Colonne L (% de l'objectif) = tonnes totales ÷ objectif. Format **%**.
- **2.4** Colonne M (appréciation) : « Objectif atteint » si L ≥ 100 %, « Proche » si L ≥ 80 %, sinon « Faible » (deux `SI` l'un dans l'autre).
- **2.5** Sous le tableau : total des voyages, total des tonnes, moyenne de disponibilité.
- **2.6** **Trie** le tableau par tonnes totales, de la plus grande à la plus petite. Qui est le meilleur opérateur ?
- **2.7** Mets un **filtre** et affiche seulement les postes de **nuit** du camion **CB-03**.
- **2.8** **Mise en forme conditionnelle** : colore en rouge les disponibilités inférieures à 80 %, et en vert les « Objectif atteint ».

### NIVEAU 3 : feuille `N3_Carburant` (gasoil)
- **3.1** Colonne E : montant = litres × prix par litre.
- **3.2** Colonne H : total des litres pour chaque engin, avec `SOMME.SI`.
- **3.3** Colonne I : nombre de pleins pour chaque engin, avec `NB.SI`.
- **3.4** Colonne J : moyenne de litres par plein. Utilise `SIERREUR` pour éviter l'erreur #DIV/0!.
- **3.5** Ligne 13 : le total général. Quel engin consomme le plus ? Pourquoi, à ton avis ?

### NIVEAU 4 : feuilles `N2_Production` et `N4_Engins`
- **4.1** Colonne N de `N2_Production` : va chercher le **modèle** du camion dans la table `N4_Engins` avec `RECHERCHEV`. Attention aux `$` pour bloquer la table.
- **4.2** Crée une **liste déroulante** (Données → Validation des données → Liste) dans une case pour choisir « Jour » ou « Nuit ».
- **4.3** Calcule le total des tonnes du camion CB-01 **uniquement la nuit**, avec `SOMME.SI.ENS`.
- **4.4** Combien de fois un camion a-t-il eu **plus de 2 heures de panne** ? Utilise `NB.SI` avec la condition ">2".

### NIVEAU 5 : feuille `N5_Rapport_poste` (le rapport du chef d'équipe)
- **5.1** Écris une date (par exemple 03/10/2026) en B3 et « Jour » en B4.
- **5.2** Remplis **automatiquement** les cases jaunes (nombre de camions, voyages, tonnes, pannes, disponibilité…) avec `NB.SI.ENS`, `SOMME.SI.ENS` et `MOYENNE.SI.ENS`, qui vont chercher dans `N2_Production`.
- **5.3** Change la date en B3 : tout le rapport doit se mettre à jour tout seul. **C'est exactement ce qu'un bon chef d'équipe sait faire.**
- **5.4** Fais un **tableau croisé dynamique** (Insertion → Tableau croisé dynamique) à partir de `N2_Production` : les tonnes par opérateur, et les tonnes par camion.
- **5.5** Fais un **graphique en barres** des tonnes par jour.
- **5.6** Prépare la feuille pour l'**impression** sur une page A4 (Mise en page → Ajuster à 1 page).

---

## 3. Ton programme sur 30 jours (1 heure par jour)

| Jours | Travail |
|---|---|
| 1 à 3 | Niveau 1 + mise en forme. Refais-le 2 fois sans regarder. |
| 4 à 8 | Niveau 2. Pourcentages, tri, filtre, mise en forme conditionnelle. |
| 9 à 13 | Niveau 3. `NB.SI`, `SOMME.SI`, `SIERREUR`. |
| 14 à 19 | Niveau 4. `RECHERCHEV`, `SOMME.SI.ENS`, listes déroulantes. |
| 20 à 26 | Niveau 5. Rapport de poste automatique, tableau croisé dynamique, graphiques. |
| 27 à 30 | **Examen** : refais tout le fichier en partant d'un fichier vide, en moins de 2 heures. |

**Après chaque niveau**, envoie-moi une capture d'écran ou ton fichier : je corrige et je te donne de nouveaux exercices plus difficiles.

---

## 4. Les petites astuces qui font la différence en entretien
- **Ctrl + C / Ctrl + V** : copier / coller. **Ctrl + Z** : annuler.
- **Ctrl + flèche** : aller au bout du tableau.
- **F4** : ajoute les `$` dans une formule (bloquer une case).
- **Alt + =** : fait une `SOMME` automatique.
- **Figer les volets** : garder les titres visibles quand on descend.
- **Toujours une formule, jamais un résultat tapé à la main.**

Si on te fait passer un test Excel, il ressemblera aux niveaux 2 à 4. Si tu réussis le niveau 5, tu es au-dessus de la plupart des candidats.
