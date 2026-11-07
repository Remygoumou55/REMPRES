# DOSSIER E-BOOK — À LIRE EN PREMIER

> **Agent qui reprend ce projet : lis ce fichier en entier, puis `00-projet/CONTEXTE-PROJET.md`, puis le README du livre en cours. Tu sauras exactement où on en est. Ne recommence rien à zéro.**

Dernière mise à jour : **7 novembre 2026**.

## 1. Le projet en 3 lignes
Le client (francophone, Guinée, il tutoie et dit « mec ») transforme des formations en **e-books PDF premium** vendus en Afrique francophone et à la diaspora (sur Chariow, paiement mobile money). Chaque livre = version A4 + version téléphone + 3 kits bonus, français très simple. Ensuite on fait la **communication** (vidéos pub, visuels). **Réponds-lui toujours en français, très clairement ; il lit sur téléphone ; il veut le détail complet dans le chat (pas seulement un lien).**

## 2. Où on en est (état au 7 nov. 2026)

| # | Livre | État | Dossier |
|---|---|---|---|
| 1 | **Briser la peur d'importer — Le guide Alibaba pas à pas** (3 900 F) | ✅ Livre + kits + ZIP terminés. ✅ 14 vidéos pub faites, dont 3 « combinées » finales. ⏳ 12 visuels générés par le client, **pas encore contrôlés**. ⏳ Décision en attente : faire des versions courtes 25–30 s des vidéos. | `01-alibaba-briser-la-peur/` |
| 2 | **Acheter un terrain et construire au pays sans te faire arnaquer** | ✅ Enquête, plan, maquette validés. ✍️ **Écriture en cours** : ch. 1 à 10 écrits (parties 1, 2, 3 complètes). Reste : ch. 11 à 17, 7 fiches pays, lexique, sommaire, mentions, kits, ZIP. | `02-terrain-construction/` |
| 3 | **Élevage de poulets, chiffres en main** | ⏸ Pas commencé (sera fait après le livre 2, même méthode). | `03-elevage-poulets/` |
| 4 | **Créer son entreprise + obtenir un financement** | ⏸ Pas commencé (après le livre 3). | `04-entreprise-financement/` |

Ordre choisi par le client : **2 Terrain → 3 Poulets → 4 Entreprise/financement.**

## 3. La prochaine action exacte
0. **Agent qui reprend : le client t'a sûrement donné le message de `02-terrain-construction/MESSAGE-POUR-AGENT-SUIVANT.md`. Suis-le.** Décision du client (7 nov.) : écrire TOUT le livre 2 + kits d'abord ; il relira lui-même ensuite, puis donnera l'adresse Gmail (laisser « [adresse e-mail à ajouter] »).
1. **État de l'écriture (mis à jour à chaque étape)** : voir `02-terrain-construction/livre/README.md`, section « Avancement ». Fait : couverture, mode d'emploi, ch. 1 à 10.
2. **Prochaine étape exacte : écrire la partie 4** (ch. 11 à 16 ; partie 3 faite : `30-partie3.html`, `31-ch09.html`, `32-ch10.html`), puis partie 4 (ch. 11 à 16, fichiers `40-…` à `46-…`), partie 5 (ch. 17, `50-…`), fiches pays (`60-…`), lexique (`70-…`), mentions, sommaire (`02-sommaire.html`), kits (`src/bonus/`), ZIP.
3. Après chaque étape : construire A4 + téléphone, contrôler les pages (script de contrôle décrit dans le README du livre), mettre à jour les README, commit + push sur `main` et `claude/livres-ebooks-transformation-7t016a`.
4. Plus tard : interviews du client (`02-terrain-construction/QUESTIONNAIRE-interviews-terrain.md`) pour compléter les chiffres de Guinée.

## 4. Plan du dossier
```
e-book/
├── README.md                      ← ce fichier (point d'entrée)
├── 00-projet/
│   ├── CONTEXTE-PROJET.md         ← toutes les règles du client + méthode + astuces techniques
│   ├── JOURNAL-DES-DECISIONS.md   ← chronologie de ce qui a été décidé
│   └── conversations/HISTORIQUE-CONVERSATIONS.md  ← export intégral des messages (client + Claude)
├── 00-choix-des-sujets/           ← étude « quel prochain e-book ? » (10 domaines, top 5, top 3)
├── 01-alibaba-briser-la-peur/     ← livre 1 complet (sources, PDF, kits, communication, vidéos)
├── 02-terrain-construction/       ← livre 2 : recherches, synthèse, plan, questionnaire
├── 03-elevage-poulets/            ← livre 3 (à venir)
└── 04-entreprise-financement/     ← livre 4 (à venir)
```

## 5. Règles de travail à respecter
- **À CHAQUE RÉPONSE au client (demande du 7 nov. 2026) : mettre à jour le dossier `e-book/` (README état + fichiers produits) puis commit + push sur `main` et sur la branche de travail.** (résumé, détail dans CONTEXTE-PROJET.md)
- Git : dépôt `remygoumou55/rempres`. Le dossier `e-book/` est sur la **branche principale `main`** (demande du client, 7 nov. 2026) ET sur la branche de travail `claude/livres-ebooks-transformation-7t016a`. **Commit + push sur les deux après chaque étape** (`git push origin HEAD:main` puis push de la branche ; ne toucher qu'au dossier `e-book/`) et **mettre à jour ce README** (section 2 et 3) à chaque avancée. Pas de PR sauf demande.
- Recherches : plusieurs agents en parallèle, chaque fait avec URL + date, rien d'inventé, incertitudes marquées. Les rapports vont dans le dossier du livre (`recherches/`).
- **Astuce réseau** : l'outil WebFetch est refusé sur la plupart des sites africains, mais `curl` passe par le proxy (sites ajoutés par le client dans les réglages réseau : guineenews, guineematin, ledjely, seneweb, abidjan.net, dakaractu, lesoleil.sn, allafrica, camer.be, gabonreview, otr.tg, andf.bj, jeuneafrique, youtube, expat.com…). Lire une page : `curl -sL -A "Mozilla/5.0" URL | python3 -c "import sys,html,re;t=sys.stdin.read();t=re.sub(r'(?s)<(script|style).*?</\1>','',t);print(html.unescape(re.sub(r'<[^>]+>',' ',t))[:20000])"`.
- Quota : ~200 recherches web par tour, partagées entre agents → donner à chaque agent un plafond (~40).
- Jamais : « devenir riche », « garanti », faux témoignages, chiffres inventés.
