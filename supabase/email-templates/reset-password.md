# Configuration de l'email de réinitialisation de mot de passe

Ce template doit être collé manuellement dans le dashboard Supabase. Il n'est
pas appliqué automatiquement par les migrations SQL.

## Où le coller

Supabase Dashboard → **Authentication** → **Email Templates** → **Reset
Password**.

## Vérifier au préalable

- **Site URL** (Authentication → URL Configuration → Site URL) doit pointer
  vers le domaine de production (ex. `https://app.rempres.com`).
- **Redirect URLs** doit contenir le chemin `/reset-password` du domaine de
  production ET, si besoin, des environnements de staging :
  - `https://app.rempres.com/reset-password`
  - `http://localhost:3000/reset-password`

Sans ces URLs en liste blanche, Supabase refusera le `redirectTo` envoyé
depuis `/forgot-password`.

## Subject

```
Réinitialisation de votre mot de passe RemPres
```

## Body (HTML)

```html
<h2 style="margin:0 0 16px;font-family:Inter,Arial,sans-serif;color:#0E4A8A;">
  Réinitialisation de mot de passe
</h2>

<p style="font-family:Inter,Arial,sans-serif;color:#1f2937;line-height:1.55;">
  Bonjour,
</p>

<p style="font-family:Inter,Arial,sans-serif;color:#1f2937;line-height:1.55;">
  Vous avez demandé à réinitialiser votre mot de passe pour votre compte
  RemPres ERP.
</p>

<p style="font-family:Inter,Arial,sans-serif;color:#1f2937;line-height:1.55;">
  Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
</p>

<p style="text-align:center;margin:24px 0;">
  <a
    href="{{ .ConfirmationURL }}"
    style="background:#0E4A8A;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-family:Inter,Arial,sans-serif;font-weight:600;"
  >
    Réinitialiser mon mot de passe
  </a>
</p>

<p style="font-family:Inter,Arial,sans-serif;color:#6b7280;font-size:13px;line-height:1.55;">
  Ce lien expire dans 24 heures. Si vous n'avez pas demandé cette
  réinitialisation, ignorez simplement cet email.
</p>

<p style="font-family:Inter,Arial,sans-serif;color:#6b7280;font-size:13px;">
  L'équipe RemPres
</p>
```

## Notes

- `{{ .ConfirmationURL }}` est remplacé automatiquement par Supabase. Cette
  URL pointe vers le `redirectTo` fourni par l'application
  (`${origin}/reset-password`), avec le token de session dans le fragment
  d'URL. Le client navigateur consomme le hash et `getSession()` retourne
  une session valide pendant ~1 heure (durée configurable côté Supabase).
- Ne pas remplacer `{{ .ConfirmationURL }}` par une URL en dur — sinon le
  lien n'authentifie plus la session et `/reset-password` affichera
  « Lien invalide ou expiré ».
- Le template est valable pour les locales French/English/Portugais : la
  copie n'inclut que des chaînes traduites en français.
