# REMPRES ERP — Phase B2.1
# CRM Write Path — Sales Mutation Governance

**Date :** 2026-05-22  
**Prérequis :** B1.1→B1.6 · **B2.0**  
**Mode :** mutations CRM gouvernées + UI minimale (pas conversion devis→vente)

---

## Synthèse

| Élément | Statut |
|---------|--------|
| State machine B1.5 | `lib/vente/runtime/crm-state-machine.ts` |
| Mutations | `modules/crm/server/services/crm-mutations.ts` |
| Server actions | `modules/crm/server/actions/crm-actions.ts` |
| Registre B2.0 | **Activé** sauf `QUOTE_CONVERT_SALE` (B2.2) |
| SEC-1 | Via `assertCrmWriteActionAllowed` sur chaque mutation |
| Audit | `recordCrmGovernanceAudit` après chaque write |
| UI | Leads, opportunités, devis — formulaires + transitions inline |

**Tests :** 91/91 (dont `b2-1-crm-write-path.test.ts`)

---

## Actions activées

- Lead : create, update status, convert → client  
- Opportunité : create, update stage  
- Devis : create, update status (pas `converted` → erreur `crm:quote_convert_use_b22`)  
- Activité : create, complete (API prête ; UI activités = phase ultérieure)

---

## Prochaine étape

**B2.2** — `QUOTE_CONVERT_SALE` + orchestration transactionnelle `quote-sale-orchestration.ts`
