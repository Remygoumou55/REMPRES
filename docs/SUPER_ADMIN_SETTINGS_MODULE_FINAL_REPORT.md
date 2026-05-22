# SUPER_ADMIN — Module Paramètres (phase 1.5) — rapport de validation

**Date (contexte projet)** : 2026-05-22  
**Périmètre** : centre de configuration ERP (utilisateurs, permissions, sécurité, devise, taux, notifications, système, langue verrouillée), menu collapsible rail super_admin, bandeau horizontal gouverné, suppression de la « Console administration ».

Rapport **strict et honnête** — sans promesse « 100 % terminé ».

---

## 1. Éléments supprimés ou neutralisés

| Élément | Action |
|--------|--------|
| Hub hybride `/admin` (grille IA / cloud / multi-tenant / …) | **Supprimé** — redirection vers `/settings`. |
| Entrée rail « Console administration » (`ROUTES.admin`) | **Retirée** du module latéral non super_admin ; remplacée par module **Paramètres** → `/settings`. |
| Page `/settings` : sélecteur multi-langue actif | **Retiré** du parcours gouverné (hub admin + page langue verrouillée). |
| Liens `/config` vers ancienne page hybride « Ouvrir paramètres utilisateur » | **Remplacés** par centre Permissions. |
| Groupe Paramètres super_admin : lien « Système » → `/admin` | **Remplacé** par structure `SETTINGS_GOVERNANCE_NAV`. |

---

## 2. Validation menu collapsible

| Contrôle | Statut |
|---------|--------|
| Groupe **Paramètres** dans `SUPER_ADMIN_NAV_GROUPS` aligné sur `SETTINGS_GOVERNANCE_NAV` | **Oui** |
| Sous-menu vertical dans le rail (pas de sidebar secondaire Paramètres) | **Oui** (`CollapsibleNavGroup` inchangé) |
| Entrée **Langue 🔒** visible | **Oui** |
| Bandeau horizontal `SettingsGovernanceNav` sur chemins Paramètres | **Oui** (`GovernanceChrome` + layouts `settings`, `config`, `admin` pour users/currency) |

---

## 3. Validation utilisateurs

| Contrôle | Statut |
|---------|--------|
| Centre `/admin/users` (liste, statuts, invitation, suspension, etc.) | **Existant** — conservé, intégré au bandeau Paramètres |
| Hub Paramètres : compteurs utilisateurs | **Oui** (`getSettingsGovernanceOverview`) |

---

## 4. Validation permissions

| Contrôle | Statut |
|---------|--------|
| Page `/config` = centre Permissions gouverné | **Oui** (`PermissionsGovernancePanel` + rôles `GOVERNED_ERP_ROLES`) |
| Matrice DB complexe exposée en UI | **Non** — référentiel lecture seule, honnête |

**Limite** : les libellés MANAGER_* sont **gouvernance produit** ; l’assignation reste département + `role_key` générique en base.

---

## 5. Validation sécurité

| Contrôle | Statut |
|---------|--------|
| Centre `/settings/security` (sans tokens / secrets / env) | **Oui** |
| Liens vers journaux, alertes, utilisateurs | **Oui** |

**Limite** : pas de tableau « sessions actives » dédié — agrégation via journaux existants.

---

## 6. Validation devise / taux

| Contrôle | Statut |
|---------|--------|
| Devise `/settings/currency` (GNF, référence ERP) | **Oui** |
| Taux `/admin/currency` (source unique taux) | **Oui** — entrée bandeau « Taux » |
| Duplication taux dans `/config` | **Supprimée** |

---

## 7. Validation notifications

| Contrôle | Statut |
|---------|--------|
| Centre `/settings/notifications` | **Oui** — liens gouvernés (alertes, approbations, journaux) |
| Hub ancien `/settings` comme seule page notifications | **Non** — hub restructuré |

---

## 8. Validation système

| Contrôle | Statut |
|---------|--------|
| Centre `/settings/system` (version, statut, liens supervision) | **Oui** |
| Panneau développeur (logs bruts, stack, env) | **Non exposé** depuis ce centre |

---

## 9. Verrou langue

| Contrôle | Statut |
|---------|--------|
| Page `/settings/language` placeholder 🔒 | **Oui** |
| Sélecteur FR/EN/ZH/PT désactivé sur hub gouverné | **Oui** |
| `updatePreferredLanguageAction` encore présent côté code | **Oui** (fichier `settings/actions.ts`) — **non branché** sur le hub gouverné |

**Risque** : un utilisateur non admin accédant à d’anciennes routes pourrait encore avoir des chemins i18n ailleurs — hors périmètre super_admin strict.

---

## 10–11. Responsive / mobile

| Contrôle | Statut |
|---------|--------|
| Bandeau Paramètres scroll horizontal | **Oui** (même pattern Actions/Archives) |
| Grilles hub / cartes | **Responsive** (`sm` / `xl`) |
| Tests devices automatisés | **Non exécutés** dans cette passe |

---

## 12. Factorisation

| Élément | Statut |
|--------|--------|
| `SETTINGS_GOVERNANCE_NAV` source unique (bandeau + rail super_admin) | **Oui** |
| `SettingsSectionShell`, `PermissionsGovernancePanel`, `SettingsGovernanceHub` | **Oui** |
| `GovernanceChrome` : Actions / Archives / **Paramètres** exclusifs | **Oui** |

---

## 13. Performance

| Contrôle | Statut |
|---------|--------|
| Overview Paramètres : requêtes `count` head uniquement | **Oui** |
| `Suspense` sur layouts settings/config | **Oui** |

---

## 14. Problèmes résolus

1. Double navigation Administration vs Paramètres.  
2. `/admin` hub technique accessible comme « Système ».  
3. Bandeau Actions sur `/admin/users` et `/admin/currency`.  
4. Permissions = page placeholder sans gouvernance rôles.  
5. Multi-langue actif sur Paramètres (dette i18n).

---

## 15. Risques restants

1. **URLs `/admin/*` hors menu** (IA, cloud, …) : toujours atteignables par URL directe → segment header « Vue hors menu supervision ».  
2. **Sessions actives** : pas de vue dédiée ; dépendance aux journaux.  
3. **Rôles MANAGER_*** : documentation produit ≠ clés DB dédiées.  
4. **Opérateurs non super_admin** : module latéral « Paramètres » simplifié (une entrée) — pas le rail collapsible complet.

---

## 16. Confirmation (sans sur-promesse)

Le module **Paramètres** pour le périmètre traité est :

- **Plus gouverné** (structure officielle, bandeau, rail alignés).  
- **Plus cohérent** (fin de la Console administration comme hub).  
- **Plus sécurisé** en UX (pas de secrets sur centres Paramètres).  
- **Partiellement production-ready** : fondations solides, mais pas « enterprise-grade exhaustif » sur sessions, RBAC UI avancé et purge des routes `/admin` legacy.

**Non honnête de dire** : zéro dette, 100 % terminé, ou suppression totale des consoles techniques historiques sous `/admin`.
