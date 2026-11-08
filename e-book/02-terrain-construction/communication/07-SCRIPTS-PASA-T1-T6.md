# Nouveaux scripts T1 à T6 — structure PASA, cible diaspora (8 nov. 2026)

Le client a montré une conversation avec une autre IA : 6 structures de pub (PAS, AIDA, BAB, 4C, QUEST, FAB), puis PASA, et 5 voix off « diaspora » (confiance, rêve, famille, sacrifices, distance).
**Il veut :** une pub qui met la personne de la diaspora dans SA situation, puis Problème → Aggravation → Solution (le guide arrive comme solution, pas comme sujet) → bénéfices + bonus → appel à l'action. La personne ne doit pas sentir la pub au début.

## Ce qu'on garde de cette conversation
- La structure PASA et l'idée que le guide arrive comme solution.
- Les angles : méfiance, rêve, famille, sacrifices, distance.

## Ce qu'il ne faut PAS reprendre tel quel
1. « Quatre guides bonus » est **faux** : ce sont **4 kits** (checklists, modèles, calculs, carnets de suivi). Écrire « 4 guides » = promesse trompeuse.
2. Textes trop longs (60 à 90 s). Une pub Facebook/TikTok : 35 à 45 s.
3. Solution trop vague (« un guide pratique a été conçu », « des précautions »). Il faut UNE astuce concrète et vraie tirée du livre : c'est elle qui donne confiance.
4. Accroches trop lentes (« Tu vis en Europe, aux États-Unis ou ailleurs… ») : la personne doit se reconnaître en 2 secondes.
5. « véritables garanties » : on évite toute la famille du mot « garanti ».

**8 nov. 2026 : le client décide de REFAIRE AUSSI T1 et T2 dans cette direction → les 6 vidéos sont refaites en PASA. Les scènes Google Flow déjà générées pour T1 et T2 (`videos/t1/src`, `videos/t2/src`) sont réutilisables ; on complète seulement si la nouvelle voix l'exige. Les montages T1/T2 actuels deviennent des archives.**

Note d'honnêteté T2 : dans le livre, Mamadou ne perd PAS son terrain (il a « les 3 ingrédients du piège », puis remet tout en ordre : « Mamadou, un an après »). L'ancienne voix T2 disait « déjà vendu à quelqu'un d'autre » : retiré dans la nouvelle version.

## Répartition des angles (chaque vidéo = un angle différent)
| Vidéo | Angle PASA | Ce qui est vérifié dans le livre |
|---|---|---|
| T1 « La photo » (à refaire) | méfiance : les photos qui ne prouvent rien | ch. 15-16, Kit 2 |
| T2 « Mamadou » (à refaire) | famille / confiance : tout dans une seule main | ch. 8 (3 clés) |
| T3 « Deux acheteurs » | sacrifices : le reçu qui ne prouve rien | ch. 3, ch. 4, Kit 1 (12 vérifications) |
| T4 « Au nom de qui ? » (remplace « Le classement ») | famille : le titre au nom du cousin | ch. 19 (+ escalier du ch. 3 à l'image) |
| T5 « Le maçon » | distance : la grosse avance, l'argent du fer | ch. 14, 15, Kit 2 (contrat) |
| T6 « Le retour » (remplace « Dix minutes ») | rêve : rentrer un jour chez soi | L'essentiel en 10 min (3 règles, 10 phrases) |

## Les textes à coller dans ElevenLabs (voix Hugo)

### T1 — La photo (méfiance)
```
Tu es loin du pays. Ton téléphone vibre. « Grand frère, le chantier avance bien. Regarde la photo. » <break time="0.7s" /> Un mur, du ciment, des ouvriers. Tu souris. Et tu envoies la suite de l'argent. <break time="0.7s" /> Mais ce mur... il est où ? Et il date de quand ? Cette photo peut venir de n'importe quel chantier. <break time="0.7s" /> Et toi, à des milliers de kilomètres, tu paies sur la parole d'une image. <break time="0.7s" /> Avant chaque paiement, demande un appel vidéo en direct. La borne de ton terrain, la rue, puis les murs. Tu vois tout, maintenant. <break time="0.7s" /> Le message pour demander ces preuves sans vexer personne est prêt dans le guide « Les erreurs à éviter avant d'investir au pays », avec quatre kits prêts à remplir. <break time="0.7s" /> Une photo ne prouve rien. Une preuve en direct, si. Douze mille neuf cents francs. Le lien est juste en dessous.
```

### T2 — Mamadou (famille, tout dans une seule main)
```
Voici Mamadou. Il vit loin du pays, comme toi. Et son histoire ressemble à beaucoup d'autres. <break time="0.7s" /> Chaque mois, il envoie de l'argent à son cousin. Pour le terrain, pour les fondations. Il n'a jamais vu le papier du terrain. Il reçoit juste des photos sur WhatsApp. <break time="0.7s" /> Il ne le sait pas encore, mais tous les ingrédients du piège sont là. L'argent, les papiers et le chantier, dans une seule main. <break time="0.7s" /> C'est comme ça que l'argent disparaît. Que des chantiers s'arrêtent. Et que des familles ne se parlent plus. <break time="0.7s" /> Dans le guide « Les erreurs à éviter avant d'investir au pays », tu suis Mamadou étape par étape, jusqu'à ce qu'il remette tout en ordre. Avec la règle des trois clés, et quatre kits prêts à remplir. <break time="0.7s" /> Aime ta famille. Mais paie contre des preuves. Douze mille neuf cents francs. Le lien est juste en dessous.
```

### T3 — Deux acheteurs (sacrifices)
```
Des années de travail loin du pays. Les heures en plus, les vacances que tu n'as pas prises. Tout ça pour un terrain. <break time="0.7s" /> Ton frère t'envoie le reçu. Le terrain est payé. Tu respires. <break time="0.7s" /> Et un jour, une autre famille arrive sur ton terrain. Avec un reçu, elle aussi. <break time="0.7s" /> Parce qu'un reçu prouve que tu as payé. Il ne prouve pas que le vendeur avait le droit de vendre. <break time="0.7s" /> Avant de payer un seul franc, il y a douze vérifications à faire. Au bureau foncier, chez ton notaire, avec ton géomètre, et chez les voisins. <break time="0.7s" /> Elles sont toutes dans le guide « Les erreurs à éviter avant d'investir au pays », en liste à cocher, avec quatre kits prêts à remplir. <break time="0.7s" /> Vérifie avant, pas après. Douze mille neuf cents francs. Le lien est juste en dessous.
```

### T4 — Au nom de qui ? (famille)
```
Tu envoies l'argent. Ton cousin s'occupe de tout. C'est la famille, tu lui fais confiance. <break time="0.7s" /> Il trouve le terrain. Il paie. Et pour aller plus vite, le papier est fait... à son nom. « On changera plus tard. » <break time="0.7s" /> Sauf que sur le papier, le propriétaire, c'est lui. Pas toi. S'il revend, ou s'il lui arrive quelque chose, tu n'as rien pour prouver que c'est ton terrain. <break time="0.7s" /> Et tu n'oses rien dire. Parce que c'est la famille. <break time="0.7s" /> Le guide « Les erreurs à éviter avant d'investir au pays » te montre comment acheter de loin, sans tout confier à une seule personne. Ton notaire, une procuration limitée, et un titre à TON nom. <break time="0.7s" /> Avec quatre kits prêts à remplir, dont le message pour demander les preuves sans vexer personne. <break time="0.7s" /> Aider ta famille, oui. Mettre ton terrain à son nom, jamais. Douze mille neuf cents francs. Le lien est juste en dessous.
```

### T5 — Le maçon (distance)
```
Tu es à des milliers de kilomètres. Et au pays, ta maison va enfin sortir de terre. <break time="0.7s" /> Le maçon appelle : « Il me faut une grosse avance pour commencer. » Puis : « Envoie-moi l'argent du fer, je vais l'acheter. » <break time="0.7s" /> Tu envoies. Les semaines passent. Le chantier n'avance plus. Le maçon ne répond plus. Et toi, tu ne peux pas aller voir. <break time="0.7s" /> Avec une grosse avance, tu as perdu ton seul moyen de pression. <break time="0.7s" /> La règle : une petite somme pour démarrer. Puis tu paies chaque étape finie, les fondations, les murs, la dalle. Toujours après la preuve. Et le fer, tu le paies directement au fournisseur. <break time="0.7s" /> Le contrat avec le maçon est prêt à remplir, dans les kits du guide « Les erreurs à éviter avant d'investir au pays ». <break time="0.7s" /> Paie ce qui est fait, pas ce qui est promis. Douze mille neuf cents francs. Le lien est juste en dessous.
```

### T6 — Le retour (rêve)
```
Tu as un rêve. Rentrer un jour au pays, et ouvrir la porte de TA maison. <break time="0.7s" /> Alors chaque mois, tu envoies. Pour le terrain. Pour le ciment. Pour les murs. <break time="0.7s" /> Mais certains découvrent la vérité seulement le jour du retour. Un terrain qui a un autre propriétaire. Une maison à moitié faite. Et l'argent, parti. <break time="0.7s" /> Souvent, tout a commencé par une seule phrase : « Il faut payer aujourd'hui, d'autres acheteurs attendent. » <break time="0.7s" /> Le guide « Les erreurs à éviter avant d'investir au pays » commence par l'essentiel en dix minutes : les trois règles d'or, et les dix phrases qui doivent t'arrêter net. Puis tout le détail, avec quatre kits prêts à remplir. <break time="0.7s" /> Ton rêve mérite dix minutes avant de payer. Douze mille neuf cents francs. Le lien est juste en dessous.
```

Durée prévue : environ 40 à 50 s chacune avec la voix Hugo. On mesure sur la vraie voix.
Questions en attente : « au lieu de 15 000 » (vrai prix après lancement + date de fin ?) ; garder le prix dit à voix haute ou seulement à l'écran ?
