# REMPRES ERP — Micro phase M1
# Fondation officielle des départements ERP

**Produit :** RemPres ERP  
**Date :** 2026-05-22  
**Mode :** architecture organisationnelle — **aucun développement métier, aucune UI définitive**  
**Prérequis validés :** Super Admin verrouillé (phase 1.6 — `docs/SUPER_ADMIN_FINAL_LOCKDOWN_REPORT.md`)  
**Sources auditées :** `CAHIER_DES_CHARGES_REMPRES_ERP.md`, `docs/CONTEXTE-PROJET-CDC.md`, `docs/ALIGNEMENT_CAHIER_ETAT_ACTUEL.md`, `lib/departments/department-config.ts`, `lib/constants/departments.ts`, `supabase/sql/035_authorization_generic_roles_departments.sql`, navigation `app-shell` / `useActiveNav`, middleware, rapports gouvernance existants.

---

## Synthèse exécutive

La phase M1 **ne valide pas** que l’implémentation actuelle est déjà alignée sur la cible organisationnelle. Elle **verrouille la carte cible** et documente l’**écart honnête** entre cible et code.

**Décision officielle M1 (à respecter pour tout travail ultérieur) :**

| # | Entité | Nature | Statut cible |
|---|--------|--------|--------------|
| 0 | **SUPER_ADMIN** | Couche gouvernance plateforme (pas un département métier) | Validé — hors rail métier |
| 1 | **VENTE** | Département métier (inclut **CRM** : clients, pipeline, devis) | Officiel |
| 2 | **FINANCE** | Département métier | Officiel |
| 3 | **RESSOURCES HUMAINES (RH)** | Département métier | Officiel |
| 4 | **FORMATION & CONSULTATION** | **Un seul** département métier fusionné | Officiel (fusion **non encore reflétée** en base / code) |
| 5 | **MARKETING** | Département métier | Officiel |
| 6 | **LOGISTIQUE** | Département métier | Officiel |

**Hors départements métiers officiels (à traiter explicitement, pas comme « 8e département ») :**

- **Paramètres / configuration** → périmètre **SUPER_ADMIN** (`/settings/*`), pas département.
- **Audit interne** → **fonction transversale** (rôle `auditor` + journaux), pas département métier au même titre que Vente.
- **Administration / Direction** → **rôle organisationnel** (manager `ADMINISTRATION`, ex-DG), pas un département produit.

**Verdict M1 :** la structure cible est **claire, cohérente, scalable en conception**, mais l’ERP est encore en **état hybride** (double référentiel départements, Consultation séparée en SQL, CRM scindé en module UI, cahier des charges obsolète sur la liste des départements). **Production-ready organisationnellement** uniquement après phase d’alignement code/SQL (hors périmètre M1).

---

## 1. Carte actuelle ERP (état réel du dépôt)

### 1.1 Trois référentiels parallèles (problème structurel majeur)

| Référentiel | Fichier / lieu | Clés | Entités listées |
|-------------|----------------|------|-----------------|
| **A — Canon technique RBAC** | `lib/departments/department-config.ts` + `public.departments` (SQL 035) | `UPPERCASE` | VENTE, FINANCE, RH, FORMATION, **CONSULTATION**, MARKETING, LOGISTIQUE, **ADMINISTRATION**, **AUDIT** (9) |
| **B — Registre cockpit /dept** | `lib/constants/departments.ts` | `lowercase` slug | vente, finance, rh, formation, consultation, marketing, logistique (7) — **sans** administration, audit |
| **C — Modules UI shell** | `app-shell.tsx` + `useActiveNav` | `ModuleId` | commerce, **crm**, finance, rh, logistics, actions, settings — **sans** formation, consultation, marketing |

Conséquence : la même réalité métier est nommée et découpée **trois fois différemment**. Toute évolution département doit cibler **une source unique** (recommandation : référentiel A étendu, B et C comme vues dérivées).

### 1.2 Routes applicatives par zone (inventaire)

| Préfixe / zone | Rôle dans l’ERP aujourd’hui | Maturité observée |
|----------------|----------------------------|-------------------|
| `/dashboard` | Accueil ; cockpit super_admin ; dashboard métier selon rôle | Vente/Finance/RH avancés ; super_admin verrouillé |
| `/vente/*` | Vente + **CRM** (`/vente/crm/*`) + stock lié vente | **Noyau le plus mature** |
| `/finance/*` | Finance + sous-espace `enterprise/*`, `visual` | Partiel à avancé |
| `/rh/*` | RH + `visual`, collaborateurs, etc. | Partiel |
| `/formation/*`, `/consultation/*` | Modules dédiés | **Stub** → `coming-soon` |
| `/marketing/*` | Module marketing | Stub / early |
| `/logistique/*` | Logistique | Pages présentes (stock, achats, entrepôts…) |
| `/actions`, `/archives`, `/settings` | Gouvernance super_admin | **Verrouillé** |
| `/admin/*` | Gouvernance (approbations, audit, logs) + **~140 pages legacy** (IA, cloud, compliance…) | Gouvernance active + **dette pages** bloquées super_admin |
| `/dept/*` | Supervision KPI par slug (registre B) | Lecture supervision |
| `/direction` | Page « Direction » (lien Actions) | **Legacy** ; masquée sidebar ; synonyme `ADMINISTRATION` en SQL |
| `/config` | Alias permissions → redirect officiel | Legacy verrouillé |

### 1.3 Navigation actuelle (non super_admin)

- **Rail principal :** Commerce (vente sans CRM), CRM (sous `/vente/crm`), Finance, RH, Logistique, Actions, Paramètres (selon permissions).
- **Sidebar secondaire :** oui (`SecondarySidebarPanel`) — **absente** pour super_admin uniquement.
- **Écart M1 :** CRM doit être **sous-domaine VENTE**, pas module parallèle au sens organisationnel ; l’UI actuelle crée une **illusion de département CRM**.

### 1.4 Super Admin (relation validée, rappel)

- Rail : Accueil, Actions, Archives, Paramètres uniquement.
- Supervise via cockpit, `/dept/*`, `/admin/departments/[key]`, archives audit filtrées par `department=`.
- **Ne doit pas** devenir département métier ; `profiles.department_key` = `null` pour `super_admin` (SQL 035).

### 1.5 Cahier des charges vs réalité

Le cahier liste **9 blocs** dont Direction Générale, Consultation séparée, Paramètres système — et des **phases roadmap séparées** Formation puis Consultation.  
L’alignement document `docs/ALIGNEMENT_CAHIER_ETAT_ACTUEL.md` (avril 2026) est **partiellement obsolète** sur le Super Admin et la gouvernance `/settings`.

---

## 2. Départements officiels (cible M1)

Structure **validée par analyse** (avec réserves §3–4) :

### 0 — SUPER_ADMIN (gouvernance)

| Attribut | Valeur |
|----------|--------|
| Territoire | Supervision globale, configuration, audit, archives, utilisateurs, sécurité |
| Routes | `/dashboard` (cockpit), `/actions`, `/archives`, `/settings`, `/admin/*` gouvernés, `/dept` lecture |
| N’est pas | Département métier, module POS, RH opérationnel |

### 1 — VENTE (incl. CRM)

| Attribut | Valeur |
|----------|--------|
| Territoire | Clients, produits, ventes, historique, reçus, **pipeline CRM**, devis, conversion |
| Routes cible | `/vente/*` (CRM = sous-arbre, pas clé département séparée) |
| Ownership | Chiffre d’affaires opérationnel, relation client active, catalogue commercial |
| Exclut | Comptabilité légale, paie, campagnes média pures, entrepôt supply chain |

### 2 — FINANCE

| Attribut | Valeur |
|----------|--------|
| Territoire | Dépenses, trésorerie, paiements, facturation enterprise, reporting financier |
| Routes | `/finance/*` |
| Ownership | Enregistrement financier, contrôle dépenses, agrégats comptables |
| Exclut | Saisie vente POS, fiches RH, stock physique |

### 3 — RESSOURCES HUMAINES

| Attribut | Valeur |
|----------|--------|
| Territoire | Collaborateurs, contrats, présence, recrutement, conformité RH |
| Routes | `/rh/*` |
| Ownership | Cycle de vie employé, obligations RH |
| Exclut | Contenu pédagogique formation (après fusion : voir frontière §4) |

### 4 — FORMATION & CONSULTATION (fusion officielle)

| Attribut | Valeur |
|----------|--------|
| Territoire | Programmes formation, sessions, apprenants ; **missions conseil**, livrables, engagements client conseil |
| Clé canonique recommandée | `FORMATION` (ou `FORMATION_CONSULTATION` — **à trancher en phase alignement**, pas en M1 code) |
| Routes cible | Un préfixe racine (ex. `/formation/*` avec sous-espaces consultation) — **à définir en phase routing** |
| Décision M1 | **CONSULTATION n’est plus un département indépendant** |

### 5 — MARKETING

| Attribut | Valeur |
|----------|--------|
| Territoire | Campagnes, communication, visibilité, performance acquisition |
| Routes | `/marketing/*` |
| Ownership | Message, canaux, leads **en amont** ; transfert vers Vente pour closing |
| Exclut | Exécution vente, facturation |

### 6 — LOGISTIQUE

| Attribut | Valeur |
|----------|--------|
| Territoire | Stock matériel, entrepôts, mouvements, achats, supply |
| Routes | `/logistique/*` |
| Ownership | Disponibilité physique, flux, approvisionnement |
| Exclut | Prix catalogue vente, contrat RH |

**Nombre de départements métiers officiels : 6** (+ couche gouvernance SUPER_ADMIN).

---

## 3. Départements legacy

| Entité | Manifestation | Action future (hors M1) |
|--------|---------------|-------------------------|
| **Consultation** (clé séparée) | `DEPARTMENT_KEYS.CONSULTATION`, ligne SQL, routes `/consultation`, registre B, archives audit `department=formation` vs consultation | Migration fusion → clé unique ; redirections |
| **Direction** | Route `/direction`, libellé cahier « Direction Générale » | Remplacer par gouvernance super_admin + manager ADMINISTRATION ; déprécier URL |
| **Administration** (comme « département produit ») | `ADMINISTRATION` supervisionOnly, DG manager | Conserver comme **rôle pivot**, pas comme 7e département métier dans la carte officielle |
| **Paramètres système** (cahier §9) | Maintenant `/settings` gouvernance | **Reclassé** — plus un « département » |
| **Module UI `commerce` vs `crm`** | Deux entrées rail pour un seul département VENTE | Unifier sous libellé Vente avec sous-menu CRM |
| **~140 pages `/admin/*` non gouvernées** | Stubs enterprise (IA, cloud, multitenant…) | Purge ou quarantaine — documenté super_admin lockdown |
| **Cahier 9 départements + phases 3–4 séparées** | Document source | **Mettre à jour le CDC** pour refléter fusion et super_admin |

---

## 4. Départements hybrides / ambigus

| Cas | Nature | Risque |
|-----|--------|--------|
| **AUDIT** (`DEPARTMENT_KEYS.AUDIT`) | Département technique + rôle `auditor` | Confusion avec super_admin / Actions ; traiter comme **fonction**, pas département P&L |
| **ADMINISTRATION** | Manager global sans routes métier | Chevauche super_admin et `/direction` |
| **Stock « vente »** | Description registre B : « stock » dans Vente ; Logistique gère supply | Chevauchement **Logistique ↔ Vente** (voir §5) |
| **Finance enterprise** | Sous-arbre riche `/finance/enterprise/*` | Risque « mini-ERP finance » sans frontière vers Vente (revenus) |
| **Archives multi-départements** | Filtres audit `department=finance|rh|formation` | OK supervision ; clés doivent suivre la fusion formation/consultation |

---

## 5. Départements illégitimes ou dupliqués (par rapport à la cible M1)

| Élément | Verdict M1 |
|---------|------------|
| **CONSULTATION** comme département autonome | **Illégitime** (fusion officielle) — encore **légitime en code** jusqu’à migration |
| **CRM** comme département organisationnel | **Duplication conceptuelle** de VENTE — légitime comme **sous-module** uniquement |
| **commerce** (`ModuleId`) | **Alias UI** de Vente — à fusionner conceptuellement avec VENTE |
| **Direction Générale** (cahier #1) | **Duplication** de SUPER_ADMIN + ADMINISTRATION — ne pas ajouter comme 8e département |
| **Paramètres** (cahier #9) | **Duplication** de gouvernance super_admin |

---

## 6. Chevauchements détectés

| Zone A | Zone B | Nature du chevauchement | Mitigation cible |
|--------|--------|-------------------------|------------------|
| **Marketing** | **Vente / CRM** | Leads vs opportunités vs clients | Marketing = campagne ; Vente = pipeline et closing ; API « lead handoff » |
| **Finance** | **Vente** | Revenus : CA vente vs écritures finance | Vente = source opérationnelle ; Finance = consolidation / paiement / dépense |
| **RH** | **Formation & Consultation** | Compétences employés vs programmes / missions | RH = contrat & présence ; Formation-Consultation = parcours et missions (pas paie) |
| **Logistique** | **Vente** | Stock produit vendable vs stock entrepôt | Logistique = qty physique & mouvements ; Vente = prix, promo, vente (référence produit partagée) |
| **SUPER_ADMIN** | **Tous** | Visibilité globale | Lecture / audit / config uniquement ; pas de mutation métier |
| **AUDIT (rôle)** | **SUPER_ADMIN Actions** | Journaux & audit | AUDIT = contrôle interne restreint ; SUPER_ADMIN = gouvernance complète |

---

## 7. Frontières métiers (règles de séparation)

Chaque département officiel doit respecter :

1. **Une clé canonique** (`departments.key`) = une entrée dans le référentiel unique.  
2. **Des préfixes URL dédiés** (`routePrefixes`) sans chevauchement opérationnel.  
3. **Un owner métier** (manager de département) — rôle générique `manager` + `department_key`.  
4. **Pas de mutation cross-dept** sans workflow gouvernance (approbations existantes).

**Frontières normatives (résumé) :**

```
SUPER_ADMIN     → gouverne, ne produit pas
VENTE           → relation client & revenu opérationnel (incl. CRM)
FINANCE         → argent enregistré, contrôlé, reporté
RH              → personnes employées
FORMATION_CONSULTATION → savoir, missions, livrables (fusion)
MARKETING       → demande & visibilité marché
LOGISTIQUE      → physique & flux
```

**Zones grises à trancher avant dev métier intensif :**

- Où vit le **stock critique** affiché au cockpit (Vente vs Logistique) — aujourd’hui agrégat vente/logistique mélangé dans KPI globaux.  
- **Devis / facturation** : frontière Vente (commercial) vs Finance (légal-comptable).  
- **Recrutement** : RH vs lien avec Formation (onboarding).

---

## 8. Relations SUPER_ADMIN ↔ départements

| Dimension | Comportement attendu | État actuel |
|-----------|---------------------|-------------|
| Hiérarchie | SUPER_ADMIN au-dessus des départements, pas dans leur organigramme | OK conceptuellement |
| Navigation | Pas de modules métier au rail | OK (`SuperAdminPrimarySidebar`) |
| Accès routes | Gouvernance + lecture traçabilité vente | OK (`lib/auth/supervision.ts`) |
| Cockpit | KPI tous départements, liens `/dept/*` | OK ; formation/marketing souvent N/D |
| Supervision par département | `/admin/departments/[departmentKey]` | OK pour clés supervisées ; **exclut** ADMINISTRATION, AUDIT, CONSULTATION si non « supervised » |
| Confusion à éviter | super_admin ≠ manager Vente | Bloqué opérationnellement |

**Règle M1 :** toute future matrice de rôles départementaux doit référencer `SUPER_ADMIN` comme **rôle plateforme**, pas comme `department_key`.

---

## 9. Scalability review (30–40 départements)

| Critère | Évaluation | Commentaire |
|---------|------------|-------------|
| Table `departments` normalisée | **Favorable** | Clés extensibles, `active`, labels |
| Type `DepartmentKey` figé en TypeScript | **Risque** | `Record<DepartmentKey, …>` impose mise à jour code à chaque ajout |
| Triple référentiel | **Défavorable** | Refonte future coûteuse si non unifié avant croissance |
| `/dept/[deptKey]` générique | **Favorable** | Pattern scalable pour dashboards supervision |
| Modules shell hardcodés | **Défavorable** | `useActiveNav` + `modules[]` en dur — chaque dept = modification manuelle |
| RLS par `department_key` | **Favorable** | Modèle prêt pour isolation |

**Recommandations architecture (sans coder en M1) :**

1. **Source unique** : `public.departments` + `department-config` généré ou validé par script.  
2. **Registre UI dérivé** : `DEPARTMENTS` cockpit = filtre `active` + mapping slug.  
3. **Navigation** : module = département OU sous-module explicite (CRM sous VENTE), jamais les deux comme départements.  
4. **Prévoir** clés stables `UPPERCASE` en base, slugs `lowercase` en URL.  
5. **Éviter** d’ajouter des départements dans le cahier sans passage par la table `departments`.

**Verdict scalabilité :** **conception DB OK**, **couche app partiellement fermée** — alignement requis avant 30+ départements.

---

## 10. Risques futurs

| Risque | Probabilité | Impact |
|--------|-------------|--------|
| Fusion Formation/Consultation non migrée en SQL | Élevée | Données, invitations, archives incohérentes |
| CRM reste module shell séparé | Moyenne | UX « deux départements » pour Vente |
| Stock double compté Vente/Logistique | Moyenne | KPI faux, conflits mutation |
| Cahier des charges non mis à jour | Élevée | Re-dérive roadmap (phases 3–4 séparées) |
| Pages admin legacy réactivées | Faible | Gouvernance hybride (mitigé lockdown) |
| Ajout départements sans registre unique | Moyenne | Chaos permissions / navigation |
| Rôles `responsable_*` legacy vs `manager` | Moyenne | Mapping déjà partiel dans `roles.ts` |

---

## 11. Départements / domaines potentiels futurs (non implémentés — signalés uniquement)

À évaluer plus tard ; **ne pas ajouter en M1** :

| Domaine | Pertinence RemPres | Note |
|---------|-------------------|------|
| **Achats / Procurement** | Élevée | Chevauche Logistique — soit sous LOGISTIQUE soit dept dédié si volume |
| **Legal / Juridique** | Moyenne | Contrats, conformité |
| **Support / SAV** | Moyenne | Après montée en charge Vente |
| **Qualité (QHSE)** | Moyenne | Industrie / formation |
| **Operations** | Variable | Si multi-sites |
| **IT / Digital** | Faible à moyenne | Distinct de super_admin technique |
| **Compliance** | Partiellement présent | Stubs `/admin/compliance` — gouvernance, pas dept métier |
| **Data / BI** | Faible | Plutôt couche transversale super_admin |

---

## 12. Liste complète des problèmes trouvés

1. **Double (triple) référentiel départements** (`department-config` vs `constants/departments` vs `ModuleId`).  
2. **CONSULTATION encore officielle en base et code** — contraire à la décision fusion M1.  
3. **CRM = module UI parallèle** — contraire à « Vente inclut CRM ».  
4. **Formation, Consultation, Marketing absents du rail** non super_admin — départements officiels invisibles dans la navigation principale.  
5. **Cahier des charges** : 9 entrées dont Direction et Paramètres comme « départements ».  
6. **ALIGNEMENT_CAHIER** partiellement obsolète (super_admin, settings).  
7. **Route `/direction`** legacy encore exposée (admin/super_admin).  
8. **ADMINISTRATION** et **AUDIT** : statut ambigu (département vs rôle/fonction).  
9. **Chevauchement stock** Vente / Logistique non tranché normativement.  
10. **Pages admin legacy** nombreuses — dette structurelle (non métier mais bruit organisationnel).  
11. **Cockpit super_admin** : pas de carte « Formation & Consultation » fusionnée ; consultation encore dans registre B.  
12. **Archives audit** : libellés séparés formation / consultation.  
13. **`useActiveNav`** : `/archives` mappé sur `settings` pour non super_admin — artefact technique.  
14. **Phases roadmap CDC** : Formation et Consultation séparées — incohérent avec fusion M1.

---

## 13. Liste complète des incohérences

| # | Incohérence | Gravité |
|---|-------------|---------|
| I1 | Décision produit fusion ≠ `public.departments` (2 lignes) | **Critique** |
| I2 | Décision produit fusion ≠ `DEPARTMENT_OPTIONS_UI` / invitations | **Critique** |
| I3 | VENTE officiel inclut CRM ≠ `ModuleId` `commerce` + `crm` | **Haute** |
| I4 | 6 départements cible M1 ≠ 7 cartes `/dept` | **Moyenne** |
| I5 | 6 départements cible ≠ 9 clés `DepartmentKey` | **Haute** |
| I6 | SUPER_ADMIN verrouillé ≠ cahier « Direction = Super Admin dept » | **Moyenne** (doc) |
| I7 | Paramètres = gouvernance ≠ cahier « département #9 » | **Moyenne** (doc) |
| I8 | Registre B lowercase vs config A UPPERCASE | **Moyenne** (technique) |
| I9 | Marketing stub mais département officiel M1 | **Basse** (attendu pré-dev) |
| I10 | `listSupervisedDepartments()` inclut FORMATION et CONSULTATION séparément | **Haute** post-fusion |

---

## 14. Confirmation officielle M1

| Critère | Statut | Commentaire |
|---------|--------|-------------|
| **Claire** | **Oui (cible)** / **Partiel (code)** | La carte cible M1 est explicite ; le code mélange encore les registres |
| **Cohérente** | **Oui (cible)** / **Non (implémentation)** | Fusion consultation non appliquée |
| **Non dupliquée** | **Oui (cible)** / **Non (implémentation)** | CRM, triple registre, Direction |
| **Gouvernée** | **Oui** | SUPER_ADMIN verrouillé ; séparation gouvernance/métier claire |
| **Scalable** | **Oui avec réserves** | DB oui ; TS nav en dur à refactorer avant 30+ dept |
| **Enterprise-grade** | **Oui (fondation)** | Documentée, honnête, prête pour phase rôles/départements métiers |

### Formulation officielle

> **La fondation organisationnelle ERP RemPres est validée en phase M1 au niveau de la carte des départements et des frontières.**  
> **L’alignement technique complet (SQL, référentiels, navigation, CDC) est une phase ultérieure obligatoire** avant de considérer l’organisation comme « sans dette structurelle ».

---

## 15. Prochaines étapes recommandées (hors M1 — pas de code ici)

1. **Mettre à jour** `CAHIER_DES_CHARGES_REMPRES_ERP.md` (liste départements, fusion, super_admin, paramètres).  
2. **Décider clé fusion** : `FORMATION` élargi vs nouvelle clé `FORMATION_CONSULTATION`.  
3. **Plan de migration SQL** : fusion Consultation → Formation, redirections URL, backfill `profiles.department_key`.  
4. **Unifier référentiels** A → B → C (script de vérité unique).  
5. **Regrouper navigation Vente + CRM** sous un seul module départemental.  
6. **Trancher** stock ownership Vente/Logistique par écriture normative (1 page spec).  
7. **Phase rôles métiers** : s’appuyer sur cette carte — pas avant.

---

## Annexe A — Matrice inventaire rapide

| Entité | Catégorie M1 | En SQL 035 | En config A | En registre B | Module shell |
|--------|--------------|------------|-------------|---------------|--------------|
| SUPER_ADMIN | Gouvernance | — (null profil) | — | — | Rail dédié |
| VENTE | Officiel | Oui | Oui | Oui | commerce + crm |
| FINANCE | Officiel | Oui | Oui | Oui | finance |
| RH | Officiel | Oui | Oui | Oui | rh |
| FORMATION (+ CONSULTATION) | Officiel fusion | Oui (2 lignes) | Oui (2 clés) | Oui (2 cartes) | **Absent** |
| MARKETING | Officiel | Oui | Oui | Oui | **Absent** |
| LOGISTIQUE | Officiel | Oui | Oui | Oui | logistics |
| CONSULTATION | Legacy → fusion | Oui | Oui | Oui | — |
| ADMINISTRATION | Rôle / legacy | Oui | Oui | Non | — |
| AUDIT | Fonction | Oui | Oui | Non | — |
| Paramètres | Gouvernance | — | — | — | settings |
| Direction | Legacy URL | → ADMIN | — | — | — |

---

## Annexe B — Documents de référence

- `docs/SUPER_ADMIN_FINAL_LOCKDOWN_REPORT.md`  
- `docs/CONTEXTE-PROJET-CDC.md`  
- `docs/ALIGNEMENT_CAHIER_ETAT_ACTUEL.md` (à réviser post-M1)  
- `lib/departments/department-config.ts`  
- `lib/constants/departments.ts`  
- `supabase/sql/035_authorization_generic_roles_departments.sql`

---

*Rapport M1 — architecture uniquement. Aucun module métier créé, aucune UI définitive, aucune permission détaillée ajoutée.*
