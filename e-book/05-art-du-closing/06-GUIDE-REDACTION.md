# Guide de rédaction — « L'Art du Closing » (à respecter pour TOUS les chapitres)

> **Modèle à imiter :** les chapitres déjà validés par le client, dans `livre/manuscrit-v2/01-…` à `05-…`. Relis au moins le chapitre 2 et le chapitre 4 avant d'écrire.
> **Build PDF :** `python3 livre/build-pdf-v2.py` (il lit tous les `.md` de `livre/manuscrit-v2/` dans l'ordre alphabétique).

## 1. Le lecteur et le ton
- Français **très simple** (niveau CM2), phrases courtes, **tutoiement**. Le livre **parle avec le lecteur** comme une personne en face de lui : il lui pose des questions, l'interpelle (« Ça t'est déjà arrivé ? », « Toi, tu dirais quoi ? »).
- Chaque mot technique est expliqué. On n'utilise pas un mot qu'on n'a pas encore défini.
- Toujours **concret** : des situations réelles de vente en Afrique. Pas de théorie sans exemple.

## 2. Les 5 profils (personnages fictifs, JAMAIS de ville citée)
| Lettre | Type | Personnage |
|---|---|---|
| A | Le vendeur en face (boutique, marché) | **Fanta**, vendeuse de **robes** au marché (ses produits = robes) |
| B | Le vendeur en ligne (produits physiques) | **Amina**, vendeuse de **chaussures et de sacs** sur WhatsApp/Facebook (elle) |
| C | Le vendeur de produits digitaux | **Ibrahima**, vendeur de **formations en ligne** (il) |
| D | Le commercial / prestataire de services | **Koffi**, commercial, **fournitures de bureau** (il) |
| E | Le livreur | **Sékou**, **livreur à moto**, livre pour plusieurs boutiques (il) |

Client fil rouge : **Moussa**, vit à l'étranger, achète au pays à distance. Prix en « F ». Aucune ville, aucun quartier, aucun nom de marché réel.

## 3. Structure OBLIGATOIRE de chaque chapitre (dans cet ordre)
1. `# Chapitre N — Titre`
2. `<div class="accroche" markdown="1">` : 1 à 2 phrases qui interpellent (question, constat qui fait mal).
3. **Exemples** : 3 à 5 blocs `<div class="scene" markdown="1">` avec le titre `### 🎬 Exemple 1 — Prénom, contexte`. Une situation par profil concerné (A à E). Courtes, vivantes, avec des dialogues. Le lecteur doit se dire : « Ça m'est déjà arrivé ».
4. `<div class="remarque" markdown="1">` titre `### 👀 Tu as remarqué ?` : le constat commun des exemples (ce qui a mal tourné et pourquoi, sans encore donner toute la solution).
5. `<div class="bref" markdown="1">` : « **Dans ce chapitre, tu vas apprendre :** » + liste numérotée (la promesse).
6. Le contenu en sections `## 1.`, `## 2.`… : explications **progressives** (chaque section prépare la suivante, **aucune répétition** d'un chapitre précédent : on renvoie au chapitre au lieu de réexpliquer).
7. Dans le contenu, **au moins 2 quiz** : `<div class="quiz" markdown="1">` titre `### 🎯 À toi de jouer` (situation + choix A/B/C, parfois D), **immédiatement suivi** de `<div class="reponse" markdown="1">` dans CET ORDRE :
   - `### ✅ La bonne réponse : C`
   - l'explication de la bonne réponse (d'abord !)
   - `**❌ Pourquoi pas A ?** …` puis `**❌ Pourquoi pas B ?** …`
   - `**👉 La bonne action :** …`
   - Varier la place de la bonne réponse (pas toujours C).
8. Au moins 1 bloc `<div class="ecris" markdown="1">` `### ✍️ Entraîne-toi` (écrire, dire à voix haute, jeu de rôle). Lignes à remplir : `<span class="ligne"></span>` (ou `<span class="ligne court"></span>`). Si l'exercice a une correction, la mettre dans un bloc `reponse` juste après.
9. `<div class="profils" markdown="1">` `### 👥 Dans ta situation` avec **A — Fanta**, **B — Amina**, **C — Ibrahima**, **D — Koffi**, **E — Sékou** (phrases prêtes, cas précis).
10. `<div class="mots" markdown="1">` `### 📖 Les mots à connaître` : tableau Mot | En simple | En pro.
11. `<div class="erreur" markdown="1">` `### ⚠️ L'erreur à éviter`.
12. `<div class="check" markdown="1">` `### ✅ Ta checklist` (lignes « - ☐ … »).
13. `<div class="suite" markdown="1">` `### ➡️ Et maintenant ?` : **Ce que tu sais maintenant** / **Ce qui vient ensuite** / **Si tu sautes le chapitre suivant :** (ce que le lecteur va rater).

Autres blocs : `<div class="vrai" markdown="1">` = **témoignage réel** (le PDF affiche « TÉMOIGNAGES RÉELS ») : la citation entre « », puis `<span class="src">— type de personne, région (ex. Afrique de l'Ouest)</span>`. `<div class="attention" markdown="1">` = encadré spécial (ex. « 📱 Spécial vente en ligne », « 🌍 Ce que les livres étrangers oublient »).
Dans un bloc `<div … markdown="1">`, laisser une ligne vide avant une liste.

## 4. Vocabulaire fixé
- La vente a **6 étapes** (chap. 1) : 1 le client s'arrête · 2 il te laisse parler · 3 tu comprends ce qu'il veut · 4 il hésite (objection) · 5 tu lèves son doute · 6 il dit oui et il paie (+ étape bonus : il revient et recommande). Ne jamais dire « marches ».
- La **méthode RIDEAU** a **6 clés** : **R** = Retenir (gagner le droit de discuter + créer la relation) · **I** = Interroger · **D** = Démasquer (la question qui fait tomber le rideau ; rideau ou mur) · **É** = Écouter (le moment du thé, d'où vient la peur, est-elle fondée) · **A** = Apaiser (questions, ses propres paroles = cohérence, histoires, preuves ; portes pour les murs) · **U** = Unir (conclure ensemble par un petit pas, confirmer, garder le client).
- Outils déjà présentés (à réutiliser, pas à réexpliquer en long) : PRIX + QUESTION (+ PREUVE en ligne) ; la question de la dernière chance ; la relance en 3 messages ; les 4 réalités (confiance, argent, famille, négociation) ; rideau / mur / porte ; la question « Dis-moi la vérité, ça te plaît vraiment ? » ; les 20 erreurs ; « pour qui tu achètes ? ».
- « Exemple 1, 2… » (jamais « scène » dans les titres). « Témoignages réels » (jamais « paroles réelles »).

## 5. Plan complet et frontières (pour éviter les répétitions)
| N° | Fichier | Contenu propre (ce que SEUL ce chapitre traite) |
|---|---|---|
| 06 | `06-r-retenir.md` | R : premières secondes, accueil, salutations, gagner le droit de discuter, approfondir PRIX+QUESTION (chap. 2 = règles de base, ici = la technique complète d'ouverture par profil), créer la relation (« les gens aiment parler d'eux », Tamir & Mitchell 2012, Carnegie). |
| 07 | `07-i-interroger.md` | I : les questions de découverte (situation, problème, conséquence, envie — inspiré de SPIN de Neil Rackham), « pour qui / pour quoi », qualifier (le produit lui convient-il ? sinon on ne vend pas). |
| 08 | `08-d-demasquer.md` | D : la technique complète de la question qui fait tomber le rideau, les **boucles** (encadré honnête « D'où vient cette technique ? » : Jordan Belfort, condamné à 42 mois de prison pour fraude boursière ; sa phrase « Est-ce que l'idée a du sens pour vous ? » ; Pelissier l'utilise pour faire dire la vraie peur), « quelle information vous manque ? », « qu'espérez-vous trouver chez les autres ? », boucler plusieurs fois (exemple de la cliente qui enchaîne 3 excuses), diagnostic rideau/mur en direct. |
| 09 | `09-e-ecouter.md` | É : le « moment du thé » (thé, salutations, prendre le temps), écoute active (Carl Rogers), écouter plus que parler (Gong 2025 : 57 % de parole dans les ventes gagnées contre 62 % dans les perdues ; jamais « 80/20 »), « Qu'est-ce qui vous fait penser ça ? », « Racontez-moi », l'origine de la peur, est-elle fondée ? → si oui, ne pas vendre (éthique). Le silence. |
| 10 | `10-a-apaiser.md` | A : les 3 seules choses à dire (questions, reformulations/ses propres paroles = cohérence de Cialdini, histoires), l'étiquetage de Chris Voss (« On dirait que… », ex-négociateur du FBI, *Never Split the Difference*, en français « Ne coupez jamais la poire en deux ») — correctement distingué de la cohérence ; les preuves qui rassurent en Afrique ; les portes pour les murs ; négocier la valeur, pas le prix (bonus/jara) ; techniques réelles du terrain (silence, « ajoute 50 et je fais de toi ma cliente », « parce que tu es mon client habituel », prix d'achat dit honnêtement). |
| 11 | `11-u-unir.md` | U : conclure ensemble par un petit pas (choix entre deux, réservation, résumé), confirmer que la peur est partie, demander l'engagement sans pression, après la vente (suivi, recommandation), relancer jusqu'au « non » clair. + **Fiche récapitulative RIDEAU** (tableau des 6 clés + phrase clé par profil). |
| 12 | `12-le-prix.md` | « C'est cher », « laisse à… », « dernier prix », « ailleurs moins cher », « réduction ? » : banque de réponses par profil. |
| 13 | `13-l-argent-et-le-moment.md` | « Quand j'aurai l'argent », « fin du mois », fêtes, rentrée ; acompte, réservation, paiement en plusieurs fois honnête, petit format, vendre au bon moment. |
| 14 | `14-la-confiance.md` | « C'est pas l'arnaque ? », « vous êtes où ? », « vraie photo », « original ou copie ? », « déjà arnaqué », témoignages qui ont l'air truqués ; construire sa « preuve de confiance ». |
| 15 | `15-la-famille-et-le-decideur.md` | « Mon mari / ma femme / le vieux / le patron / le comité » : inclure le décideur. |
| 16 | `16-le-temps-et-la-priorite.md` | « Je vais réfléchir », « on va voir », « je reviens », « envoie-moi les infos », le silence après le prix (nice / need ; Gong : « je dois réfléchir » allonge la vente de 173 % sans faire baisser le taux de gain). |
| 17 | `17-le-credit.md` | Dire non au crédit sans perdre le client ; règles si on fait crédit ; témoignages réels du boutiquier qui a fermé. |
| 18 | `18-commandes-annulees.md` | Le « oui, emballe » puis « j'annule », annulation en route, client injoignable, refus à la porte, faux clients, commandes fantômes ; prévention (confirmation écrite, vidéo avant envoi, frais d'engagement/acompte, heure fixée, numéro vérifié, liste des annuleurs) ; quoi faire quand ça arrive ; calcul du coût d'une annulation. |
| 19 | `19-boutique-et-marche.md` | Canal A complet (étal, magasin, affichage, accueil, file, voisins concurrents). |
| 20 | `20-whatsapp-et-reseaux.md` | Canal B : catalogue WhatsApp, statuts, live TikTok qui finit sur WhatsApp, messages vocaux, temps de réponse (HBR 2011), modèles de messages. |
| 21 | `21-produits-digitaux.md` | Canal C : la peur des « vendeurs de rêve », extrait gratuit, garantie, paiement mobile money abandonné, « le PDF gratuit ? », pas de promesse de gains. |
| 22 | `22-au-telephone.md` | Appels : voix, silences, questions, rappeler. |
| 23 | `23-commercial-entreprises.md` | Canal D : devis, décideurs multiples, comité, relance B2B. |
| 24 | `24-le-client-de-la-diaspora.md` | Moussa : peurs de la diaspora (argent confié et détourné, faux chantiers, « prix diaspora »), preuves à distance, appel vidéo, paiement par étapes. |
| 25 | `25-le-livreur-dernier-closer.md` | Profil E complet : à la porte (« repasse demain », « pas la couleur », « c'est cher »), comportement, règles vendeur-livreur, encaissement sécurisé, sa sécurité. |
| 26 | `26-la-boite-a-histoires.md` | La « poupée vaudou éthique » de Pelissier **renommée** « la boîte à histoires » : une peur = une histoire vraie ; l'histoire de la sexologue (Pelissier) comme exemple ; comment construire ses histoires ; storytelling (sans l'erreur « l'amygdale est une glande »). |
| 27 | `27-l-ethique-et-la-loi.md` | Persuader ≠ manipuler ; fausse urgence interdite (Kenya, Afrique du Sud, Côte d'Ivoire loi 2016-412, directive UEMOA 01/2023, Guinée loi sur la publicité 2024, Nigeria FCCPA art. 115 prix affichés) ; ne pas vendre si le produit ne convient pas ; Belfort comme contre-exemple. |
| 28 | `28-plan-30-jours.md` | Plan d'entraînement de 30 jours (semaine 1 à 4), journal des objections, jeux de rôle, auto-évaluation finale + retour aux 3 situations notées au début du livre. |
| 90 | `90-lexique.md` | Lexique : tableau Mot · Sens simple · Sens pro · Anglais (tous les mots du livre). |
| 91 | `91-sources.md` | Sources : les maîtres cités et ce qu'on leur doit (Pelissier et son CDD crédité clairement, Belfort, Cardone, Tracy, Ziglar, Voss, Rackham, Cialdini, Gitomer, Carnegie, Hormozi), les études et chiffres avec leurs URL (reprendre des `recherches/`), et la liste des témoignages réels avec leur source (média, date) sans noms de personnes. |
| 92 | `92-mentions.md` | Mentions : personnages fictifs, témoignages anonymisés, chiffres = ordres de grandeur datés, pas de promesse de gains, livre indépendant (non affilié aux auteurs cités). |

## 6. Faits et citations : règles absolues
- **Témoignages réels** : uniquement des citations marquées « ouvert et lu » / [LU] dans `recherches/terrain/T1…T4` et `recherches/R5`, `R6` (et pas une déjà utilisée dans un autre chapitre, sauf rappel très court). Recopier **mot pour mot** (traduire en français si anglais, en le disant). Attribuer à **un type de personne + une région** (« une vendeuse en ligne, Afrique de l'Ouest »), **jamais** ville, pays du locuteur ou nom.
- **Chiffres** : uniquement ceux vérifiés dans `02-SYNTHESE-RECHERCHES.md` et les sections « COMPLÉMENT V2 » de `recherches/R1…R6`. Interdits : « 80/20 », « 80 % après 5 relances », « 22 fois plus mémorable », « +190 % », « 126 closes », « l'amygdale est une glande », « 99 % des objections ».
- Pas de « devenir riche », « garanti », ni promesse de gains. Pas de fausse urgence dans les phrases proposées.
- Les dialogues des **Exemples** et des quiz sont **fictifs** (personnages), c'est normal ; ils ne sont jamais présentés comme des témoignages réels.
- Les phrases orales non trouvées par écrit (« je demande à mon mari », « on va voir »…) peuvent apparaître dans les exemples fictifs, mais **jamais** dans un bloc `vrai`.

## 7. Longueur
- Chapitres de méthode et d'objection : **3 500 à 5 000 mots**. Chapitres de canal : 3 000 à 4 500. Partie 5 : 2 500 à 4 000. Lexique et sources : la longueur nécessaire.
