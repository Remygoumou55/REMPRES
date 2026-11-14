# Cahier des charges — Tunnel de vente
## « Les erreurs à éviter avant d'investir au pays »

*Version 1 — 14 novembre 2026. Document à donner au développeur ou au designer, ou à suivre soi-même.*

---

## 1. Le projet en bref

| | |
|---|---|
| **Produit** | Guide numérique « Les erreurs à éviter avant d'investir au pays » |
| **Accroche** | « Que tu vives au pays ou à l'étranger : acheter un terrain et construire ta maison sans te faire arnaquer. » |
| **Contenu du pack** | Le guide complet (20 chapitres en 6 parties) + « L'essentiel en 10 minutes » + 4 kits (Checklists, Modèles, Calculs, Carnets de suivi) + 7 fiches pays + version téléphone et version à imprimer |
| **Prix** | 9 900 F CFA, au lieu de 15 000 F (voir la règle du prix barré, partie 9) |
| **Vente et livraison** | Boutique Chariow : paiement Mobile Money ou carte, téléchargement immédiat du ZIP |
| **But du tunnel** | Faire passer une personne qui voit une pub à un acheteur qui a téléchargé son pack, puis la garder comme cliente pour les prochains guides |

---

## 2. À qui on vend

**Cible 1 — La diaspora** (France, Belgique, Canada, États-Unis…)
- Elle envoie de l'argent au pays pour un terrain ou une maison.
- Sa peur : être trompée à distance (fausses photos, chantier qui n'avance pas, proche qui « mange » l'argent).
- Elle paie plutôt par carte bancaire.

**Cible 2 — Ceux qui vivent au pays**
- On leur propose un terrain « pas cher », « avec les papiers du village », « à payer aujourd'hui ».
- Leur peur : le terrain vendu deux fois, le faux papier, l'héritier qui arrive après.
- Ils paient plutôt par Mobile Money (Orange Money, Wave, MTN, Moov).

**Pays visés :** Guinée, Côte d'Ivoire, Sénégal, Cameroun, Bénin, Gabon, Togo, et la diaspora de ces pays.

👉 La page doit parler **aux deux cibles** dès le haut : « Que tu vives au pays ou à l'étranger ».

---

## 3. Le schéma du tunnel

```
[1] PUB (vidéos T1–T5, V7–V12)
        │
        ├──► [2a] PAGE DE VENTE ──► [3] PAIEMENT CHARIOW ──► [4] PAGE MERCI + TÉLÉCHARGEMENT
        │                                  │                              │
        │                                  ▼                              ▼
        │                         [5] RELANCE si pas payé        [6] SUIVI APRÈS ACHAT
        │                                                         (J+1, J+3, J+7, J+30)
        │
        └──► [2b] WHATSAPP : checklist gratuite ──► conversation ──► lien vers [2a] ou [3]
```

**Deux chemins d'entrée :**
- **Chemin A, direct :** pub → page de vente → paiement. Surtout pour la diaspora.
- **Chemin B, WhatsApp :** pub « Écris TERRAIN sur WhatsApp » → la personne reçoit une **checklist gratuite d'une page** → discussion → lien de paiement. Surtout pour l'Afrique, où on fait plus confiance à une vraie conversation.

---

## 4. Étape 1 — Les publicités

**Ce qui existe déjà :**
- les vidéos T1, T2, T3, T4 et T5 ;
- les vidéos V7, V8, V9, V10, V11 et V12, dans `02-terrain-construction/communication/videos/`.

**Ce qu'il faut demander :**
- Chaque pub a **un seul bouton** :
  - « En savoir plus », qui mène à la page de vente ;
  - ou « Envoyer un message WhatsApp ».
- Chaque lien de pub a un **code de suivi** (paramètres UTM) pour savoir quelle vidéo fait vendre. Par exemple : `?utm_source=facebook&utm_campaign=lancement&utm_content=V7`.
- Le texte de la pub reprend le **texte de vente unique** (`marketing/TEXTE-DE-VENTE-UNIQUE.md`).

---

## 5. Étape 2a — La page de vente (le cœur du tunnel)

### 5.1 Règles générales

- **Pensée d'abord pour le téléphone.** La plupart des visiteurs viennent de Facebook ou de TikTok, sur mobile.
- **Rapide.** Elle doit s'ouvrir en moins de 3 secondes, même avec une connexion faible :
  - images compressées, en WebP, de moins de 200 Ko chacune ;
  - pas de vidéo lourde qui se lance toute seule.
- **Le bouton d'achat** est visible au moins **5 fois** sur la page, et **toujours** sur téléphone dans une barre collée en bas de l'écran : « Je veux le guide — 9 900 F ».
- **Écriture :** phrases courtes, en tutoiement, français très simple, comme dans le livre.
- **Couleurs :** celles de la couverture (bleu de la couverture v3, blanc, une couleur d'accent pour les boutons).
- **Lettres :** une police grasse pour les titres, une police simple et lisible pour le texte, de 16 px minimum sur téléphone.

### 5.2 Les sections, dans l'ordre

| # | Section | Contenu | Visuel |
|---|---|---|---|
| 1 | **En-tête (« au-dessus de la ligne »)** | Titre « Les erreurs à éviter avant d'investir au pays » · l'accroche · le prix 9 900 F (15 000 F barré) · un bouton | Image 3D du guide (`communication/videos/assets/guide-3d.png`) |
| 2 | **Le choc** | « Tu envoies l'argent. On t'envoie des photos. » · « Les fondations sont faites. » « Il manque juste un peu pour le toit. » « Les papiers arrivent bientôt. » · « Et un jour, tu rentres… et tu découvres la vérité. » | Fond sombre, texte qui apparaît ligne par ligne |
| 3 | **Ceux qui vivent au pays** | Le terrain « pas cher », « avec les papiers du village », « à payer aujourd'hui, d'autres attendent » | Une seule image |
| 4 | **Le déclic** | « Dans les deux cas, les pièges se ressemblent. Et ils se voient AVANT de payer, si tu sais quoi regarder. » | — |
| 5 | **La solution** | « Ce guide a été écrit pour être tes yeux sur place. » + les **3 règles d'or** (Vérifie d'abord, paie ensuite · Ne donne jamais tout à une seule personne · Pas de papier, pas de paiement) | 3 cartes avec une icône |
| 6 | **Ce que tu vas apprendre** | Les 8 points ✅ du texte de vente, puis les 6 parties du livre en accordéon (on touche pour ouvrir) | Liste avec des coches |
| 7 | **Voir l'intérieur** | 4 à 6 **vraies pages** du livre et des kits (les 12 vérifications, le papier à exiger par pays, le calcul du budget, un carnet de suivi) | Carrousel d'images qu'on fait glisser |
| 8 | **Le pack complet** | Guide + Essentiel en 10 min + Kit 1 + Kit 2 + Kit 3 + Kit 4 + 7 fiches pays + 2 versions (téléphone et impression) | Visuel « tout ce que tu reçois », avec une liste illustrée |
| 9 | **Les 7 pays** | Les drapeaux : Guinée, Côte d'Ivoire, Sénégal, Cameroun, Bénin, Gabon, Togo + « une méthode valable partout en Afrique » | Rangée de drapeaux |
| 10 | **Pour qui / pas pour qui** | Pour toi si… (tu veux acheter, tu construis, tu envoies de l'argent) · Pas pour toi si… (tu cherches un conseil juridique personnel : le guide ne remplace pas un notaire ou un avocat) | 2 colonnes ✅ / ❌ |
| 11 | **L'honnêteté** | « Ici, pas de promesse miracle. Juste une méthode claire, de vrais faits tirés de la presse, et tout ce qu'il faut pour mettre chaque étape par écrit. » | Encadré |
| 12 | **Une vidéo** | Une des vidéos (par exemple V12 « Avant le premier appel »), lancée seulement si on appuie dessus | Lecteur vidéo léger |
| 13 | **Le prix** | Ce que tout ça coûte d'habitude (un notaire, une erreur sur un terrain) **sans inventer de chiffre**, puis : 9 900 F CFA au lieu de 15 000 F · les moyens de paiement (logos Mobile Money + carte) · téléchargement immédiat | Grand encadré avec un bouton |
| 14 | **FAQ** | Voir la partie 5.3 | Accordéon |
| 15 | **Dernier appel** | « Ton terrain, ta maison, ton argent : vérifie avant de payer. » + un bouton | — |
| 16 | **Bas de page** | Contact WhatsApp · e-mail [adresse e-mail à ajouter] · mentions légales · conditions de vente · confidentialité | — |

### 5.3 Les questions fréquentes (FAQ) à mettre

1. **Comment je reçois le guide ?** Juste après le paiement, tu télécharges un fichier ZIP. Tu le reçois aussi par e-mail.
2. **Je peux le lire sur mon téléphone ?** Oui, il y a une version spéciale téléphone et une version à imprimer.
3. **Comment je paie ?** Par Mobile Money (selon ton pays) ou par carte bancaire.
4. **Mon pays n'est pas dans les 7 fiches ?** La méthode et les 12 vérifications valent partout. Les fiches donnent les détails propres à chaque pays.
5. **Ça remplace un notaire ?** Non. Le guide t'apprend quoi vérifier et quoi demander, pour que le notaire et le géomètre travaillent pour toi.
6. **J'ai un problème pour télécharger ?** Écris-nous sur WhatsApp au [numéro à ajouter].
7. **Je peux être remboursé ?** *À décider par le client* (voir la partie 11).

### 5.4 Ce qui est INTERDIT sur la page

- ❌ Les mots « garanti », « zéro risque », « devenir riche ».
- ❌ Un faux témoignage, de faux avis, de fausses étoiles, un faux compteur de ventes (« 1 200 personnes l'ont acheté »).
- ❌ Un faux compte à rebours qui recommence chaque fois qu'on revient sur la page.
- ❌ Un nombre de pages (décision du client).
- ❌ Le nom d'une vraie victime ou d'un vrai fraudeur. Les faits réels restent anonymes.
- ✅ Les vrais avis se mettent seulement **après** les premières ventes, avec l'accord écrit du client (prénom + pays).

---

## 6. Étape 2b — Le chemin WhatsApp

- **WhatsApp Business**, avec :
  - un message d'accueil automatique ;
  - des réponses rapides (`/prix`, `/contenu`, `/paiement`, `/lien`).
- **Le cadeau gratuit (l'aimant)** : « Les 10 réflexes avant de payer un terrain », 1 page PDF tirée du Kit 1, **sans donner tout le kit**. La personne le reçoit quand elle écrit « TERRAIN ».
- **Le script de conversation, en 4 messages :**
  1. Merci + le PDF gratuit.
  2. Une question : « Tu vis au pays ou à l'étranger ? Tu en es où : terrain ou construction ? »
  3. La réponse adaptée + le lien vers la page de vente.
  4. Le lendemain, s'il n'y a pas d'achat, une relance douce. Une seule.
- **Une chaîne WhatsApp gratuite** (par exemple « Terrain sans arnaque ») pour garder le contact. Un conseil par semaine.

---

## 7. Étape 3 — Le paiement (Chariow)

- Produit Chariow avec :
  - le titre exact ;
  - la couverture ;
  - la description, reprise de `communication/12-DESCRIPTIONS-BOUTIQUE-CHARIOW.md` ;
  - le prix ;
  - le fichier `livre/dist/Terrain-et-construction-pack-complet.zip`.
- **Moyens de paiement :** tous ceux que Chariow propose dans chaque pays visé. À **vérifier pays par pays** dans le tableau de bord.
- **Le moins de champs possible :** nom, e-mail, téléphone. Rien de plus.
- **Coupon** possible (par exemple pour les membres de la chaîne WhatsApp).
- Le **pixel Meta** et le **pixel TikTok** sont branchés sur la page de paiement et sur la page merci, si Chariow le permet. À vérifier.

---

## 8. Étapes 4, 5 et 6 — Après le clic

**Page merci / téléchargement**
- « Merci ! Ton pack est prêt. » + le bouton de téléchargement.
- **Par quoi commencer :** « Ouvre d'abord "L'essentiel en 10 minutes". »
- Comment ouvrir un ZIP sur téléphone, en 3 étapes avec des images.
- Le contact WhatsApp en cas de problème.
- (Plus tard) une **offre suivante** : un autre guide de la collection, à prix réduit, seulement pour les acheteurs.

**Relance des paniers abandonnés** (la personne a commencé à payer, puis s'est arrêtée)
- Message 1, 1 heure après : « Tu as eu un souci avec le paiement ? Je peux t'aider. »
- Message 2, le lendemain : un rappel avec une des 3 règles d'or.
- Rien de plus. Pas de harcèlement.

**Suivi après achat**
- J+1 : « Tu as bien pu ouvrir ton pack ? »
- J+3 : « Tu as lu les 12 vérifications ? Lequel de ces points te concerne ? »
- J+7 : la demande d'avis (un vrai avis, et on demande l'accord pour le publier).
- J+30 : la présentation d'un autre guide de la collection.

---

## 9. Règles d'honnêteté (obligatoires)

1. **Le prix barré :** « au lieu de 15 000 F » n'est permis que si le guide est **vraiment** vendu 15 000 F après le lancement, à une **date de fin annoncée** (« prix de lancement jusqu'au [date] »). Sinon, c'est une pratique trompeuse, et Meta peut refuser la pub.
2. Chaque promesse de la page doit correspondre à un **chapitre ou un kit réel**.
3. Les faits réels cités viennent de la presse, avec leurs sources dans le livre, et restent anonymes.
4. Le guide ne remplace pas un professionnel (notaire, avocat, géomètre) : il faut le dire clairement.

---

## 10. Mesure : ce qu'il faut suivre

| Étape | Ce qu'on mesure |
|---|---|
| Pub | Coût par clic, et quelle vidéo amène le plus de visites |
| Page de vente | Visiteurs, part de ceux qui cliquent sur le bouton, jusqu'où on fait défiler |
| Paiement | Paiements commencés, paiements réussis, échecs par moyen de paiement et par pays |
| WhatsApp | Conversations, PDF envoyés, ventes venues de WhatsApp |
| Après achat | Avis reçus, demandes d'aide, remboursements |

**Outils :** les statistiques de Chariow, le gestionnaire de pub Meta et TikTok, et un tableau simple (Google Sheets) rempli chaque semaine.

On ne se fixe pas d'objectif chiffré avant d'avoir les **premières vraies données**, après 7 à 10 jours de pub.

---

## 11. Décisions à prendre par le client

| # | Question | Choix possibles |
|---|---|---|
| 1 | Où faire la page de vente ? | **A.** Seulement la page produit Chariow (simple et gratuit, mais moins de place) · **B.** Une vraie page sur un outil comme Systeme.io ou Carrd, avec le bouton qui mène à Chariow (plus convaincant, un peu plus de travail) |
| 2 | Nom de domaine | Par exemple `investir-au-pays.com` (à vérifier et acheter) ou une adresse gratuite |
| 3 | Prix barré 15 000 F | Date de fin du prix de lancement ? |
| 4 | Remboursement | Aucun (produit numérique) · ou « satisfait ou remboursé sous 7 jours » (rassure, mais demande un suivi) |
| 5 | Contacts | Numéro WhatsApp Business + adresse e-mail |
| 6 | Nom de l'auteur / de la marque | « Collection Playbooks » seulement, ou un vrai nom, ou un visage ? |

---

## 12. Ce qu'il faut livrer, et dans quel ordre

| Étape | Livrable | Qui |
|---|---|---|
| 1 | Réponses aux 6 décisions de la partie 11 | Client |
| 2 | Textes complets de la page (sections 1 à 16 + FAQ) | Claude |
| 3 | Visuels : bannière d'en-tête, « tout ce que tu reçois », 6 pages de l'intérieur, drapeaux | Claude (à partir des vrais fichiers du livre) |
| 4 | PDF gratuit « Les 10 réflexes » | Claude |
| 5 | Messages WhatsApp (accueil, réponses rapides, relances, suivi J+1 à J+30) | Claude |
| 6 | Montage de la page (Chariow ou autre outil) | Client ou développeur |
| 7 | Pixels, UTM, coupon | Client ou développeur |
| 8 | **Tests** (partie 13) | Client |
| 9 | Lancement de la pub | Client |

---

## 13. Tests avant de lancer (recette)

- [ ] La page s'ouvre bien sur un **petit téléphone Android**, en 3G.
- [ ] Le bouton d'achat marche à chaque endroit de la page.
- [ ] **Achat test par carte** depuis l'étranger : paiement OK + ZIP reçu + e-mail reçu.
- [ ] **Achat test par Mobile Money** dans au moins 2 pays : paiement OK + ZIP reçu.
- [ ] Le ZIP s'ouvre sur Android et sur iPhone, et les PDF se lisent.
- [ ] Le pixel Meta voit bien « Achat » (dans le gestionnaire d'événements).
- [ ] Le message WhatsApp automatique part, et le PDF gratuit arrive.
- [ ] Les liens de bas de page (mentions, conditions, contact) marchent.
- [ ] Aucun mot interdit, aucun faux avis, et le prix barré a une date de fin.
