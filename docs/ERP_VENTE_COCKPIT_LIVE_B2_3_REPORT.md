# ERP VENTE — Cockpit live (B2.3)

**Phase :** B2.3 — Cockpit `/vente/dashboard` data  
**Statut :** Livré  
**Prérequis :** B2.0 (KPI SoT), B1.3 (architecture cockpit), fondation verrouillée  

---

## Objectif

Remplacer le placeholder M3 sur **`/vente/dashboard`** par un cockpit manager avec données réelles, en respectant la gouvernance B2.0 :

- Commerce → `getVenteCommerceKpis` (`vente-commerce-runtime-v1`)
- CRM → `getCrmOperationalOverviewGuarded` (`crm-operational-runtime-v1`)
- **Interdit** : `getDashboardKpis`, appel direct `/api/dept/vente/kpis`, grille `CRM_NAV` sur le cockpit

---

## Livrables

| Artefact | Rôle |
|----------|------|
| `lib/vente/runtime/vente-cockpit-payload.ts` | `getVenteCockpitPayload` — source unique cockpit |
| `modules/vente/components/cockpit/VenteCockpitClient.tsx` | UI zones M3 (KPI, alertes, chart 7j, activité, actions) |
| `app/(app)/vente/dashboard/page.tsx` | Page serveur branchée sur le payload live |
| `tests/unit/b2-3-vente-cockpit-live.test.ts` | Contrats structurels |

---

## Zones cockpit (M3)

1. **Contexte** — salutation, nb alertes, sources KPI documentées  
2. **KPI** — 8 cartes (CA jour/mois, pipeline, leads, clients, activités, stock, ventes jour)  
3. **Alertes** — rupture stock, stock bas, devis expirant &lt;7j, pic annulations  
4. **Graphique** — `SalesChart` sur CA net 7 jours (commerce SoT)  
5. **Activité** — `activity_logs` filtrés modules commerce (`clients`, `produits`, `vente`, …)  
6. **Actions rapides** — 6 CTA libellés (B1.3 §8.1)  

---

## KPI affichés (alignement B1.3)

| ID B1.3 | Carte cockpit |
|---------|----------------|
| `net_revenue_today` | CA net du jour |
| `net_revenue_month` | CA net du mois |
| `sales_count_today` | Ventes du jour |
| `pipeline_weighted` | Pipeline pondéré |
| `active_leads` | Leads actifs |
| `open_quotes` | Sous-titre leads |
| `clients_active` | Clients |
| `open_activities` | Activités CRM |
| `stock_critical_sale` | Stock bas / ruptures |

---

## Hors périmètre B2.3

- `/dept/vente` (supervision SA) — inchangé, déjà sur `buildDeptVenteKpiPayload`  
- `/vente/crm` hub — reste sous-page CRM (pas fusionné dans le cockpit)  
- Approval manager devis, quotas équipe, forecast (P2)  
- Pipeline snapshot chart secondaire  

---

## Suite recommandée

- Lien drill-down KPI → modules (cartes cliquables)  
- RBAC : masquer KPI/actions selon permissions  
- Aligner historique ventes sur `lifecycle_status` (dette XL)  
