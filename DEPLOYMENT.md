# RemPres — Guide de déploiement Vercel

## Architecture de domaines

| Domaine | Rôle |
|---|---|
| `app.rempres.com` | Application Next.js (ce repo) |
| `rempres.com` | Site marketing (landing page) |

> La landing page est également disponible sur la racine `/` de l'application.
> Pour une séparation stricte, déployez un second projet Vercel avec uniquement `app/page.tsx`.

---

## 1. Pousser sur GitHub

```bash
cd rempres-erp
git add .
git commit -m "chore: production-ready — branding, favicon, landing page, security headers"
git push origin main
```

---

## 2. Connecter à Vercel

1. Aller sur [vercel.com/new](https://vercel.com/new)
2. Cliquer **"Import Git Repository"**
3. Sélectionner le repo `REMPRES`
4. **Root Directory** : `rempres-erp` ← important
5. **Framework Preset** : Next.js (auto-détecté)
6. **Build Command** : `npm run build` (par défaut)
7. **Output Directory** : `.next` (par défaut)

---

## 3. Variables d'environnement Vercel

Dans **Project Settings → Environment Variables**, ajouter :

| Variable | Valeur | Environnement |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Production uniquement |
| `NEXT_PUBLIC_APP_URL` | `https://app.rempres.com` | Production |
| `NEXT_PUBLIC_MARKETING_URL` | `https://rempres.com` | Production |

> ⚠️ Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client.

---

## 4. Configurer le domaine `app.rempres.com`

1. Dans Vercel → **Project → Settings → Domains**
2. Ajouter `app.rempres.com`
3. Dans votre registrar DNS, ajouter :
   ```
   Type : CNAME
   Name : app
   Value : cname.vercel-dns.com
   ```
4. Vercel génère automatiquement le certificat SSL (Let's Encrypt)

---

## 5. Configurer Supabase pour la production

Dans **Supabase → Authentication → URL Configuration** :

```
Site URL : https://app.rempres.com
Redirect URLs :
  https://app.rempres.com/reset-password
  https://app.rempres.com/**
```

---

## 6. Checklist avant mise en production

- [ ] Variables d'environnement configurées dans Vercel
- [ ] Domaine `app.rempres.com` ajouté et SSL actif
- [ ] Supabase Site URL mis à jour
- [ ] Supabase Redirect URLs mis à jour
- [ ] Build passe sans erreur (`npm run build`)
- [ ] Logo visible sur `/` et `/login`
- [ ] Favicon visible dans l'onglet navigateur
- [ ] PDF fonctionne sur `/vente/recu/[saleId]`
- [ ] Connexion fonctionne sur `/login`
- [ ] Journal d'activité accessible sur `/admin/activity-logs`

---

## 7. Commandes utiles

```bash
npm run dev               # Serveur local (port 3000)
npm run build             # Build de production
npm run start             # Démarrer le build local
npm run lint              # Vérification ESLint
npm run generate:favicons # Regénérer les favicons (après changement de logo)
```

---

## 8. Structure des assets publics

```
public/
├── logo.png                    # Logo principal (avec texte "RemPres")
├── fallback-logo.png           # Logo de secours
├── favicon.png                 # Source favicon (icône P)
├── favicon-dark.png            # Favicon mode sombre
├── favicon-16x16.png           # Favicon 16×16
├── favicon-32x32.png           # Favicon 32×32
├── apple-touch-icon.png        # iOS 180×180
├── android-chrome-192x192.png  # Android 192×192
└── android-chrome-512x512.png  # Android 512×512

app/
└── favicon.ico                 # Next.js 14 convention (32×32)
```

Pour regénérer après changement de logo :
```bash
# Remplacer public/favicon.png par la nouvelle icône, puis :
npm run generate:favicons
```
