# Livre 2 — décisions pour la communication (pub, page de vente)

Décisions du client (7 nov. 2026) :
- **Ne jamais annoncer le nombre de pages** (« 141 pages » fait peur à la personne pressée).
- Mettre en avant la structure : **« Un résumé de 10 minutes pour agir tout de suite + le guide complet pas à pas + 4 kits pratiques »**.
- Le résumé « L'essentiel en 10 minutes » est au début du livre (pas de kit séparé : Kit 0 retiré par le client).
- Le ZIP vendu contient **2 dossiers seulement** : « Version ordinateur (imprimable) » et « Version telephone », chacun avec le livre + les 4 kits (Kit 1 à Kit 4).
- Interdits (rappel) : « garanti », « zéro risque », « devenir riche », faux témoignages. Prix visé : 9 à 20 $ (à décider).
- Idées d'accroches déjà proposées : « Ce terrain a déjà été vendu 3 fois », « Ta famille n'est pas une garantie ».

## Décisions du 7 nov. 2026 (après l'étude de marché)
- **Prix : 12 900 F CFA** (livre + 4 kits), choisi par le client.
- 6 vidéos de 25-30 s : scripts dans `communication/01-SIX-VIDEOS-scripts.md` (en attente de validation du client, puis voix ElevenLabs « Hugo » générée par le client, puis montage par l'agent avec le moteur du livre 1 : `01-alibaba-briser-la-peur/communication/campagne/engine.js`).

## NOUVEAU TITRE DU LIVRE 2 — décision du client (7 nov. 2026, fin de soirée)
- **Titre :** « 10 erreurs à éviter avant d'investir au pays » (sans « Les » au début : c'est le choix du client).
- **Phrase d'accroche (sous-titre) :** « Que tu vives au pays ou à l'étranger : acheter un terrain et construire ta maison sans te faire arnaquer. »
- Le client a écrit « inverser » et « anarquer » : ce sont des fautes de frappe pour « investir » et « arnaquer ». Lui faire confirmer l'orthographe avant d'imprimer quoi que ce soit.
- **À FAIRE (pas encore fait) :**
  1. Couverture : `livre/src/book/00-cover.html`.
  2. Page de titre et mentions : `01-intro.html`, `80-mentions.html`.
  3. En-têtes ou titres des kits s'ils citent l'ancien titre (chercher « sans te faire arnaquer » dans `src/`).
  4. **Chapitre 1** : il parle des « 10 pièges ». Le renommer et l'adapter en « 10 erreurs », pour que le titre tienne sa promesse. Le contenu reste le même ; seule la façon de le présenter change (chaque piège devient l'erreur de tomber dedans). Mettre à jour le sommaire et « L'essentiel ».
  5. Rebuild A4 (150 pages au maximum) + téléphone + kits, puis `make-zip.sh`. Les noms des fichiers PDF peuvent rester tels quels.
  6. Vidéos : la voix de T2 dit l'ancien titre. Demander au client s'il refait cette phrase. Utiliser le nouveau titre dans T3 à T6, et le mettre sur les fins de vidéo et la page de vente.
