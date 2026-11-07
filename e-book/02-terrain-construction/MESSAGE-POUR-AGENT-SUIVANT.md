# Message à donner à l'agent suivant (livre 2 — Terrain et construction)

Bonjour. Tu reprends un projet d'e-books en cours. Réponds-moi toujours en français très simple (je lis sur téléphone, je veux le détail complet dans le chat).

**1. Lis d'abord, dans cet ordre, sur la branche principale `main` du dépôt GitHub `remygoumou55/rempres` :**
1. `e-book/README.md` (point d'entrée, état du projet, règles de travail)
2. `e-book/00-projet/CONTEXTE-PROJET.md` (toutes mes règles d'écriture et de mise en page)
3. `e-book/02-terrain-construction/README.md`, puis `PLAN-DU-LIVRE.md` (plan détaillé + mes décisions), `RAPPORT-JURIDIQUE.md` (section « DÉCISION FINALE » = règle n°1), `SYNTHESE-ENQUETE.md`
4. `e-book/02-terrain-construction/livre/README.md` et les fichiers déjà écrits dans `livre/src/book/` (couverture, mode d'emploi, chapitres 1, 2 et 4) : c'est la maquette **validée**, garde exactement ce style.
5. Les recherches dans `e-book/02-terrain-construction/recherches/` (T1 à T11, J1 à J3) : c'est là que sont tous les faits, chiffres, lois et sources. Si deux rapports se contredisent, T7, T10 et T11 ont raison (pages lues en entier). L'historique complet de nos conversations est dans `e-book/00-projet/conversations/`.

Fais-moi d'abord un court rapport : ce que tu as compris de l'état du projet et ce que tu vas faire.

**2. Ta mission : écrire le livre complet** « Acheter un terrain et construire au pays sans te faire arnaquer » (titre provisoire), avec tous les chapitres du plan (1 à 17), les 7 fiches pays (Guinée, Côte d'Ivoire, Sénégal, Cameroun, Bénin, Gabon, Togo), le lexique et les kits bonus (au moins 3, plus si le contenu le demande), en version A4 **et** version téléphone, puis le ZIP. Il reste à écrire : chapitre 3, chapitres 5 à 17, fiches pays, lexique, kits, sommaire.

**3. Les règles à respecter absolument**
- **RÈGLE N°1 — FAITS RÉELS ANONYMES** (je n'ai pas les moyens de payer un avocat) : dans les encadrés « Fait réel », jamais de pays, de ville, de quartier, de nom, de fonction précise, de montant exact ni de journal. On écrit « Fait réel — Afrique de l'Ouest, 2026 », « un agent de l'administration », « plusieurs centaines de millions ». Aucune démolition, décision d'État ou responsable nommés. Aucune politique, aucune critique d'un gouvernement. Citations de forums sans pseudo ni nom de site. Les **fiches pays** gardent les lois, papiers, bureaux, étapes et frais (information publique), datés et avec « à confirmer avec le notaire » quand ce n'est pas sûr.
- **Tout doit être vrai** : n'utilise que des informations des rapports de recherche (ou que tu vérifies toi-même sur la source). Montants jamais arrondis vers le haut. Si un chiffre n'est pas sûr, ne l'invente pas.
- Français **très, très simple** (un élève de 10e année doit tout comprendre), tutoiement (« tu »), phrases courtes. **Presque chaque mot difficile ou important expliqué « en simple » et « en pro »** dans l'encadré « Les mots à connaître ».
- Dans chaque chapitre : En bref · Les mots à connaître · Fait réel · Cas concret (Mamadou, Guinéen chauffeur à Paris ; Aïcha, commerçante à Abidjan — personnages inventés) · Phrase de la diaspora · Niveau débutant / Niveau expert · Erreur à éviter · Astuce · Checklist.
- Le mot est **« Fait réel »** (jamais « Vraie affaire »). Il y a **10 pièges** (chapitre 1).
- **Mise en page « Carnet de terrain »** (déjà en place : `livre/styles/carnet.css` et `carnet-phone.css`) : Times New Roman (Liberation Serif), grande police, une seule colonne, **aucun tableau coupé**, aucun encadré coupé entre deux pages. **« Les mots à connaître » ne doit JAMAIS être coupé** : 3 mots maximum par encadré, et plusieurs encadrés (1/2, 2/2) s'il faut. Chaque chapitre commence sur une nouvelle page. Évite les grandes pages vides.
- Interdits : « garanti », « zéro risque », « devenir riche », faux témoignages.
- Laisse **« [adresse e-mail à ajouter] »** dans l'avertissement : je te donnerai l'adresse Gmail après ma relecture.
- Le nombre de pages n'est pas fixé (il dépend du contenu). Prix visé : 9 à 20 $ (décidé à la fin).

**4. Construire les PDF**
- `node e-book/02-terrain-construction/livre/build.mjs` (A4) et `PHONE=1 node e-book/02-terrain-construction/livre/build.mjs` (téléphone). Les PDF vont dans `livre/dist/`. Les kits se mettent dans `livre/src/bonus/` (un fichier HTML par kit, avec `<!-- title: ... -->` en tête).
- Après chaque construction, vérifie les pages (images des pages en basse résolution) : rien de coupé, pas de grandes pages vides.

**5. Sauvegarde (très important, je l'exige)**
Après **chaque** étape (chaque chapitre ou groupe de chapitres), mets à jour `e-book/README.md` (sections « Où on en est » et « La prochaine action exacte ») et `e-book/02-terrain-construction/livre/README.md`, puis commit et push **sur `main` et sur la branche `claude/livres-ebooks-transformation-7t016a`** (`git push origin HEAD:main` puis push de la branche). Ne touche à rien d'autre dans le dépôt que le dossier `e-book/` (le reste, c'est mon application). Comme ça, si tu es bloqué, un autre agent peut reprendre exactement là où tu t'es arrêté.

**6. Envoie-moi les PDF au fur et à mesure** (version téléphone en premier), avec un résumé simple de ce que tu as écrit. À la fin, envoie le livre complet + les kits + le ZIP. Je ferai ma relecture moi-même et je te donnerai mes corrections.

**Astuce technique** : l'outil WebFetch est refusé sur les sites africains, mais `curl` fonctionne (sites ouverts dans les réglages réseau). Pour lire une page : `curl -sL -A "Mozilla/5.0" URL | python3 -c "import sys,html,re;t=sys.stdin.read();t=re.sub(r'(?s)<(script|style).*?</\1>','',t);print(html.unescape(re.sub(r'<[^>]+>',' ',t))[:20000])"`.

Commence par lire, puis fais-moi ton rapport.
