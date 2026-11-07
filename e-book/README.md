# DOSSIER E-BOOK — À LIRE EN PREMIER

> **Agent qui reprend ce projet : lis ce fichier en entier, puis `00-projet/CONTEXTE-PROJET.md`, puis le README du livre en cours. Tu sauras exactement où on en est. Ne recommence rien à zéro.**

Dernière mise à jour : **7 novembre 2026**.

## 1. Le projet en 3 lignes
Le client (francophone, Guinée, il tutoie et dit « mec ») transforme des formations en **e-books PDF premium** vendus en Afrique francophone et à la diaspora (sur Chariow, paiement mobile money). Chaque livre = version A4 + version téléphone + 3 kits bonus, français très simple. Ensuite on fait la **communication** (vidéos pub, visuels). **Réponds-lui toujours en français, très clairement ; il lit sur téléphone ; il veut le détail complet dans le chat (pas seulement un lien).**

## 2. Où on en est (état au 7 nov. 2026)

| # | Livre | État | Dossier |
|---|---|---|---|
| 1 | **Briser la peur d'importer — Le guide Alibaba pas à pas** (3 900 F) | ✅ Livre + kits + ZIP terminés. ✅ 14 vidéos pub faites, dont 3 « combinées » finales. ⏳ 12 visuels générés par le client, **pas encore contrôlés**. ⏳ Décision en attente : faire des versions courtes 25–30 s des vidéos. | `01-alibaba-briser-la-peur/` |
| 2 | **Acheter un terrain et construire au pays sans te faire arnaquer** | ✅ Enquête terminée (11 rapports, 2 séries d'agents). ✅ Synthèse + plan du livre proposés. ⏳ **Le client doit valider le plan** et faire ses interviews. Écriture pas commencée. | `02-terrain-construction/` |
| 3 | **Élevage de poulets, chiffres en main** | ⏸ Pas commencé (sera fait après le livre 2, même méthode). | `03-elevage-poulets/` |
| 4 | **Créer son entreprise + obtenir un financement** | ⏸ Pas commencé (après le livre 3). | `04-entreprise-financement/` |

Ordre choisi par le client : **2 Terrain → 3 Poulets → 4 Entreprise/financement.**

## 3. La prochaine action exacte
1. Le **plan détaillé v2** du livre Terrain a été envoyé au client le 7 nov. 2026 (`02-terrain-construction/PLAN-DU-LIVRE.md`). Attendre son accord / ses remarques et sur la question : « je commence l'écriture pendant que tu fais tes interviews ? ».
2. Recevoir ses **interviews** (notes vocales) selon `02-terrain-construction/QUESTIONNAIRE-interviews-terrain.md`, les intégrer comme cas réels.
3. Écrire le livre avec la même chaîne technique que le livre 1 (`01-alibaba-briser-la-peur/build.mjs`, HTML → PDF via Playwright).

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
