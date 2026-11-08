# DOSSIER E-BOOK — À LIRE EN PREMIER

> **Agent qui reprend ce projet : lis ce fichier en entier, puis `00-projet/CONTEXTE-PROJET.md`, puis le README du livre en cours. Tu sauras exactement où on en est. Ne recommence rien à zéro.**

Dernière mise à jour : **8 novembre 2026 (reprise par un nouvel agent : tout relu, on attend la voix T3.mp3 du client)**.

## 1. Le projet en 3 lignes
Le client (francophone, Guinée, il tutoie et dit « mec ») transforme des formations en **e-books PDF premium** vendus en Afrique francophone et à la diaspora (sur Chariow, paiement mobile money). Chaque livre = version A4 + version téléphone + 3 kits bonus, français très simple. Ensuite on fait la **communication** (vidéos pub, visuels). **Réponds-lui toujours en français, très clairement ; il lit sur téléphone ; il veut le détail complet dans le chat (pas seulement un lien).**

## 2. Où on en est (état au 7 nov. 2026)

| # | Livre | État | Dossier |
|---|---|---|---|
| 1 | **Briser la peur d'importer — Le guide Alibaba pas à pas** (3 900 F) | ✅ Livre + kits + ZIP terminés. ✅ 14 vidéos pub faites, dont 3 « combinées » finales. ⏳ 12 visuels générés par le client, **pas encore contrôlés**. ⏳ Décision en attente : faire des versions courtes 25–30 s des vidéos. | `01-alibaba-briser-la-peur/` |
| 2 | **Acheter un terrain et construire au pays sans te faire arnaquer** (12 900 F CFA) | ✅ **Livre v1.0 terminé** (A4 150 p. max, téléphone ~278 p., 4 kits, ZIP 2 dossiers). ✅ Étude de marché + prix. ❌ Vidéos V1–V6 **refusées** par le client (trop identiques, pas synchro). ✅ **Nouvelles vidéos : T1 « La photo » et T2 « Mamadou » faites** (scènes Google Flow + motion design + musique propre), envoyées, **avis du client en attente**. ⏳ T3–T6 à faire. **→ Tout est dans `02-terrain-construction/communication/RAPPORT-COMPLET-ET-PASSATION.md`.** | `02-terrain-construction/` |
| 3 | **Élevage de poulets, chiffres en main** | ⏸ Pas commencé (sera fait après le livre 2, même méthode). | `03-elevage-poulets/` |
| 4 | **Créer son entreprise + obtenir un financement** | ⏸ Pas commencé (après le livre 3). | `04-entreprise-financement/` |

Ordre choisi par le client : **2 Terrain → 3 Poulets → 4 Entreprise/financement.**

## 3. La prochaine action exacte
**8 nov. 2026 — REPRISE : nouvel agent, rapport + fichiers relus. Mission : T3 → T4 → T5 → T6, une à la fois, même méthode que T1/T2. On attend que le client envoie `T3.mp3` (voix ElevenLabs). Question posée au client : la voix T3 doit-elle dire le nouveau titre « Les erreurs à éviter avant d'investir au pays » ? (la couverture des vidéos T1/T2 est l'ancienne ; pour T3+ utiliser la couverture v3).**

**8 nov. 2026 — NOUVELLE DIRECTION PUB : le client veut des pubs en structure PASA (problème → aggravation → solution → action), cible diaspora, le guide arrive comme solution. Scripts RÉÉCRITS (v2 avec accroches choc, la v1 refusée par le client) dans `02-terrain-construction/communication/07-SCRIPTS-PASA-T1-T6.md`. **Décision du client : on refait LES 6 vidéos (T1 et T2 aussi) dans cette direction** ; scènes Flow de T1/T2 réutilisables ; ordre : T1 → T2 → T3 → T4 → T5 → T6. Nouvelles versions : T1 « La photo » méfiance, T2 « Mamadou » (sans « déjà vendu », pas fidèle au livre) (T3 sacrifices/reçu, T4 « Au nom de qui ? », T5 maçon à distance, T6 « Le retour »). Ils remplacent ceux de la section 7 du rapport. En attente : la nouvelle voix T1.mp3 du client.**

**TITRE DÉFINITIF APPLIQUÉ (7 nov. 2026, 22 h) : « Les erreurs à éviter avant d'investir au pays » + accroche « Que tu vives au pays ou à l'étranger : acheter un terrain et construire ta maison sans te faire arnaquer. » Couverture REFAITE (v3 : fond = UNE image fusionnée bleu + photo, fabriquée par `livre/make-cover-bg.py` (à relancer si on change img-01) ; accroche entre « » en italique ; pays + « et partout en Afrique » ; bandeau bleu court pour bien voir la maison au fond et le coucher de soleil, « Collection Playbooks » sans « Volume 2 » avec titre Inter Display Black + accroche, photo en bas, 3 étiquettes « 1 résumé de 10 min + le guide complet + 4 kits pratiques », pays, version ; ancienne couverture abandonnée car texte illisible sur la photo), kits, métadonnées PDF et noms dans le ZIP mis à jour ; PDF A4 (150 p.) + téléphone (278 p.) + ZIP refaits. « 10 erreurs » = seulement comme accroche de pub (décision du client : un chiffre sur la couverture dévalorise le livre face au prix). Chapitre 1 inchangé (« 10 pièges »). Vidéos T3–T6 et page de vente : utiliser ce titre ; la voix T2 dit l'ancien titre (demander au client).**

**Dernière correction (7 nov., fin de soirée) : images illustratives du livre 2 affichées EN ENTIER (plus de zoom ni de recadrage) — A4 : hauteur 66 mm, image entière centrée (150 p.) ; téléphone : hauteur 46 mm, image entière centrée (278 p.). Règle CSS `figure.photo img { object-fit: contain; }` dans `livre/styles/carnet.css` (fin) et `carnet-phone.css`. Ne jamais remettre `object-fit: cover`. PDF + ZIP refaits.**

**Agent qui reprend (passation du 7 nov. 2026, 20 h 30) : lis d'abord `02-terrain-construction/communication/RAPPORT-COMPLET-ET-PASSATION.md`.** Tout y est : règles, état du livre, étude de marché, histoire des vidéos (V1–V6 refusées et pourquoi), méthode qui marche (voix ElevenLabs du client → minutage → prompts Google Flow → clips du client → montage `videos/tN/index.html` + `audio.py`), état exact T1–T6, styles déjà utilisés (à ne pas répéter), scripts T3–T6, commandes.
1. Demander au client son avis sur **T1** (`communication/videos/T1-la-photo.mp4`) et **T2** (`communication/videos/T2-mamadou.mp4`), corriger.
2. Lui reposer 2 questions : « au lieu de 15 000 » = vrai prix après lancement + date de fin ? ; la voix T2 dit-elle bien « arnaquer » ?
3. Puis **T3 « Deux acheteurs »** : quand il envoie `T3.mp3` → mesurer → écrire `communication/06-T3-SCENES-GOOGLE-FLOW.md` (prompts dans des blocs de code, comme T1/T2) → montage dans `communication/videos/t3/`. Idem T4, T5, T6.
4. Ensuite : visuels fixes, page de vente, adresse Gmail dans le livre (puis rebuild + ZIP), livre 3.
5. Après chaque étape : mettre à jour ce README + commit + push sur `main` et `claude/livres-ebooks-transformation-7t016a`. Ne toucher qu'à `e-book/`.

Historique mot pour mot : `00-projet/conversations/HISTORIQUE-CONVERSATIONS.md` + `HISTORIQUE-CONVERSATIONS-SUITE.md`.

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
