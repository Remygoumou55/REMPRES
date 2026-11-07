# Journal des décisions (chronologie)

Le détail mot pour mot est dans `conversations/HISTORIQUE-CONVERSATIONS.md`.

## 5 novembre 2026 — Démarrage
- Le client veut transformer 10 à 15 formations en e-books vendus comme produits digitaux, puis en vidéos pour les meilleurs.
- Règles fixées (voir CONTEXTE-PROJET.md) : français très simple, 55–80 pages, A4 + téléphone, 3 kits, lexique, chaque chapitre sur une nouvelle page, pas d'espaces vides, cas concrets, niveaux débutant/expert.

## 5–6 novembre — Livre 1 « Briser la peur d'importer »
- Recherches 01 à 05 (Alibaba, logistique/douane, paiements, produits/fournisseurs, familles de produits 2026) → `01-alibaba-briser-la-peur/recherches-du-livre/`.
- Livre écrit : 64 p. A4 / 129 p. téléphone, 32 illustrations (prompts ChatGPT, images contrôlées et corrigées), 3 kits, ZIP.
- Prix : ~~5 000~~ **3 900 F CFA** sur Chariow ; dans les pubs on dit « Commander maintenant » (pas « Chariow »).

## 6 novembre — Communication du livre 1
- Recherches 06 concurrence, 07 peurs de l'audience, 08 créatives qui vendent → `communication/recherches/`.
- 3 avatars : débutant perdu dans les vidéos TikTok ; vendeur du marché local qui a peur d'Alibaba ; importateur qui laisse le transitaire tout calculer (et se fait surfacturer).
- Stratégie : 3 vidéos (A transitaire, B grossiste, C débutant) × 3 accroches, voix off ElevenLabs « Hugo », motion design maison (engine.js + Playwright + ffmpeg), musique originale (music.py).
- Corrections client : désynchronisation voix/images corrigée, effets sonores baissés ; garder les 9 versions ; faire 3 vidéos « combinées » avec les 2 meilleures accroches :
  - A = « Ne paie plus jamais ton transitaire sans vérifier ce calcul » + « Ton transitaire calcule, toi tu payes, mais qui vérifie ? »
  - B = « Ton grossiste achète sur Alibaba. Pourquoi pas toi ?… » avec les personnages Kouamé (grossiste debout dans l'entrepôt) et Moussa (jeune homme assis sur un carton, inquiet)
  - C = « Tu ne manques pas de vidéos… tu manques d'un ordre » + « Arrête de regarder des vidéos… »
- Kit de lancement (page artifact) avec les 3 vidéos finales, plan Meta en 8 étapes, budgets (A 3 000 F/j, B 2 500, C 2 000) : `communication/06-kit-de-lancement.html`.
- 12 prompts visuels (V01–V07 boutique, P01–P05 pubs) : `communication/05-prompts-visuels-boutique-et-pubs.txt`. Le client les a générés — **pas encore envoyés pour contrôle**.
- Analyse honnête avant de payer la pub : couverture trop tardive, vidéos trop longues (40–51 s). Proposition : versions courtes 25–30 s + petit test (~22 500 F sur 3 jours). **Réponse du client en attente.** Lien de la page Chariow demandé, pas reçu.

## 6 novembre — Choix du prochain e-book
- 3 agents : demande par métier, problèmes par secteur, marché des produits digitaux → `00-choix-des-sujets/`.
- Mon top 3 : poulets, terrain, gestion de boutique. **Le client a choisi** : 1) Terrain et construction, 2) Élevage de poulets, 3) Créer son entreprise + financement — à étudier « de fond en comble », avec les vraies réalités, sans émotion.
- Pays : Guinée, Côte d'Ivoire, Sénégal, Cameroun, Bénin, Gabon, Togo, toute l'Afrique, et **surtout la diaspora** (Europe, Amérique, Canada) qui veut investir mais doute (famille pas fiable, agences arnaqueuses).

## 6–7 novembre — Enquête Terrain et construction
- 1ʳᵉ série : 7 agents (T1 à T6) — sites bloqués, quota épuisé, résultats partiels.
- Le client a ajouté les sites de presse dans les réglages réseau. Découverte : WebFetch refusé mais `curl` fonctionne.
- 2ᵉ série : T7 Guinée complet, T8 frais + procuration, T9/T11 chantier, T10 vérification des faits + voix de la diaspora.
- Synthèse + plan du livre proposés → `02-terrain-construction/SYNTHESE-ENQUETE.md` et `PLAN-DU-LIVRE.md`.
- Questionnaire d'interviews donné au client.

## 7 novembre — Sauvegarde
- Le client craint la fin de l'abonnement : tout est rangé dans le dossier `e-book/` (ancien `ebooks/`) sur GitHub, avec l'historique complet des conversations, pour qu'un autre agent reprenne exactement ici.

## 7 novembre — Retour du client sur le plan du livre 2
- Titre/sous-titre/couverture/couleurs provisoires ; pages et nombre de kits non fixés (selon le contenu) ; prix visé 9 à 20 $ (5 000 F jugé trop bas) ; tout doit être réel ; français très simple (niveau 10e année) ; mots expliqués en simple et en pro ; personnages Mamadou et Aïcha validés. Détail : `02-terrain-construction/PLAN-DU-LIVRE.md` (section « Décisions du client »).
