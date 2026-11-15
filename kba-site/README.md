# Site web de Korea Business Auto (KBA)

Site vitrine et catalogue de KBA : voitures d'occasion coréennes, vérifiées et livrées en Afrique de l'Ouest.
Projet **séparé** de l'ERP REMPRES : il a son propre `package.json` et peut être déplacé dans son propre dépôt.

## Lancer le site
```bash
cd kba-site
npm install
npm run dev        # http://localhost:3100
npm run build && npm start   # version de production
```

## Technologies
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Polices : Montserrat (titres, la même que le logo), Inter (texte), JetBrains Mono (étiquettes). Elles sont auto-hébergées, sans appel à Google.
- Aucune base de données pour l'instant : le contenu est dans `src/data/`. Le site est 100 % statique (rapide, hébergement gratuit possible sur Vercel).

## Où modifier quoi
| Fichier | Contenu |
|---|---|
| `src/data/site.ts` | Nom, **numéro WhatsApp**, téléphone, e-mail, adresse, RCCM, taux de change |
| `src/data/cars.ts` | **Les voitures** : une entrée par voiture (photos, caractéristiques, prix, défauts, documents) |
| `src/data/countries.ts` | Pays livrés : limite d'âge, port, délai, sources |
| `src/data/content.ts` | Les 10 étapes, les documents, la FAQ, les vérifications |
| `src/data/guides.ts` | Les guides (articles) |
| `public/images/voitures/<voiture>/` | Les photos de chaque voiture |
| `public/brand/` | Le logo (SVG), `design/logo/build_logo.py` pour le régénérer |

### Ajouter une voiture
1. Mettre les photos (plaque floutée, environ 1400 px) dans `public/images/voitures/<nom-de-la-voiture>/`.
2. Copier une entrée dans `src/data/cars.ts`, changer `slug`, `ref` (KBA-00XX), les infos et `photos`, et mettre `isExample: false`.
3. Changer `status` quand la voiture est réservée, en route ou livrée.

## ⚠️ À compléter avant la mise en ligne (TODO)
- [ ] Le numéro WhatsApp Business, le téléphone, l'e-mail et l'adresse du bureau (`site.ts`).
- [ ] Le numéro RCCM et le NIF, dès que l'entreprise est créée.
- [ ] Remplacer les **8 voitures d'exemple** par les vraies voitures des parcs.
- [ ] Les vrais documents de la première livraison sur la page « Vérifiez-nous ».
- [ ] Les photos de Désiré et Rémi (page « À propos »).
- [ ] Les liens Facebook et TikTok.
- [ ] Faire valider les conditions de vente et les mentions légales par un juriste.
- [ ] Acheter le nom de domaine (ex. koreabusinessauto.com) et le mettre dans `site.ts`.

## Mettre en ligne (Vercel, gratuit pour commencer)
1. Créer un compte sur vercel.com et importer le dépôt GitHub.
2. Choisir `kba-site` comme **Root Directory**.
3. Déployer, puis brancher le nom de domaine.

## Pages
`/` · `/voitures` · `/voitures/[voiture]` · `/comment-acheter` · `/verifiez-nous` · `/trouvez-ma-voiture` · `/pays` · `/pays/[pays]` · `/guides` · `/guides/[guide]` · `/a-propos` · `/contact` · `/faq` · `/conditions-de-vente` · `/mentions-legales`

## Version 2 (prévue)
Espace client avec suivi de commande, tableau de bord pour ajouter les voitures sans toucher au code (Supabase), calculateur de douane par pays, photos 360°.
