# REMPRES ERP — Phase P1
# CRM Event Expansion — Rapport final

**Version catalogue :** `erp-event-catalog-p1-v1`  
**Version bus :** `erp-event-bus-b3.2-v1` (inchangé)  
**Date :** 2026-05-22  
**Mode :** Foundation First — **pas de câblage mutations, pas de rebuild CRM, pas de suppression legacy**

---

## Synthèse exécutive

| Question | Verdict |
|----------|---------|
| Audit CRM produit ? | **Oui** |
| Taxonomy amendée (3 types) ? | **Oui** |
| Publishers design + implémentation ? | **Oui** — prêts, non câblés |
| Plan intégration mutations ? | **Oui** |
| Coexistence legacy définie ? | **Oui** |
| Readiness | **READY** pour P1.1 (câblage) |
| P1 validé ? | **Oui** |

> **P1 étend la gouvernance CRM du bus sans toucher `crm-mutations.ts`.**  
> **Priorité immédiate : P1.1 — câbler `createCrmLead`, `createCrmQuote`, `updateCrmQuoteStatus`.**

---

## 0. Contexte ERP

### Déjà validé (ne pas refaire)

| Bloc | État |
|------|------|
| ERP Core M1→M3.75 | ✅ |
| Vente B1→B2.4 | ✅ |
| Finance B3 cockpit | ✅ |
| Approval B3.1 | ✅ |
| Event Bus B3.2 | ✅ |
| Exploitation B3.2+ | ✅ |
| Convert B3.3a | ✅ — commit `2e3512f` |

### Règle officielle

Toute extension → `lib/erp-core/events/` + amendement `OFFICIAL_ERP_EVENT_TYPES`.

---

## 1. Audit CRM — état actuel

### 1.1 Cartographie mutations (`crm-mutations.ts` + `quote-sale-conversion.ts`)

| Fonction | Action registry | Bus publié | Audit legacy |
|----------|-----------------|------------|--------------|
| `createCrmLead` | `crm.lead.create` | ❌ | ✅ |
| `updateCrmLeadStatus` | `crm.lead.update_status` | ❌ | ✅ |
| `convertCrmLeadToClient` | `crm.lead.convert` | ❌ | ✅ |
| `createCrmOpportunity` | `crm.opportunity.create` | ❌ | ✅ |
| `updateCrmOpportunityStage` | `crm.opportunity.update_stage` | ❌ | ✅ |
| `createCrmQuote` | `crm.quote.create` | ❌ | ✅ |
| `updateCrmQuoteStatus` | `crm.quote.update_status` | ❌ | ✅ |
| `createCrmActivity` | `crm.activity.create` | ❌ | ✅ |
| `completeCrmActivity` | `crm.activity.complete` | ❌ | ✅ |
| `convertCrmQuoteToSale` | `crm.quote.convert_sale` | ✅ (4 events) | ✅ |

**Ratio bus-driven :** 1/10 mutations (10%) — quote-centric.

### 1.2 Publishers CRM existants (pre-P1)

| Publisher | Event | Câblé |
|-----------|-------|-------|
| `emitCrmQuoteConvertRequested` | `crm.quote.convert_requested` | ✅ |
| `emitCrmQuoteConverted` | `crm.quote.converted` | ✅ |
| `emitRuntimeOrchestrationFailed` | `runtime.orchestration.failed` | ✅ |
| (+ interne) | `runtime.orchestration.completed` | ✅ |

### 1.3 Side effects legacy CRM

| Mécanisme | Fichier | Occurrences |
|-----------|---------|-------------|
| `recordCrmGovernanceAudit` | `crm-mutations.ts` | 9 |
| `recordCrmGovernanceAudit` | `quote-sale-conversion.ts` | 1 |
| `tryCreateAlert` | — | **0** dans CRM direct |
| Gate approval | `crm-write-governance` | convert only |

**Audit hook :** insert direct `governance_audit_events` category `mutation` — parallèle au bus category `event`.

### 1.4 Dette identifiée

| ID | Dette | Gravité |
|----|-------|---------|
| D1 | 90% mutations sans bus | Haute |
| D2 | `entityType` incohérent (`crm_quote` vs `crm_quotes`) | Faible |
| D3 | 0 handler prod | Attendu |
| D4 | Lead status update hors P1 taxonomy | Planifié P2 |

### 1.5 Risques

- Câblage P1.1 sans ordre gate→DB→publish→audit → double trace incohérente
- Suppression prématurée audit legacy → perte forensic
- entityType mixte → filtres handlers futurs

### 1.6 Dépendances

- `assertCrmWriteActionAllowed` (B2.0/B3.1) — inchangé
- `CRM_WRITE_ACTION_REGISTRY` — inchangé
- Bus security — acteur requis (internal)

---

## 2. Governance amendment — catalogue P1

### 2.1 Nouveaux types officiels

| Constante | Type | Family | Sensitivity | Owner |
|-----------|------|--------|-------------|-------|
| `CRM_LEAD_CREATED` | `crm.lead.created` | domain | internal | vente-crm |
| `CRM_QUOTE_CREATED` | `crm.quote.created` | domain | internal | vente-crm |
| `CRM_QUOTE_STATUS_UPDATED` | `crm.quote.status_updated` | domain | internal | vente-crm |

**Total catalogue :** 14 types (11 → 14).

### 2.2 Statuts ERP_EVENT_GOVERNANCE_MAP

| Statut | CRM events |
|--------|------------|
| **active** | convert_requested, converted (+ runtime via convert) |
| **partial** | lead.created, quote.created, quote.status_updated |

**Événements prefix `crm.` :** 5 (runtime orchestration = famille runtime, hors filtre CRM).

Fichier : `event-taxonomy.ts`, `event-catalog-governance.ts` (`erp-event-catalog-p1-v1`).

---

## 3. Publisher design map

Fichier : `governance/crm-publisher-design-map.ts`

### 3.1 Publishers P1 (publisher_ready)

| Publisher | Payload clés | entityType | correlationId |
|-----------|--------------|------------|---------------|
| `emitCrmLeadCreated` | status, company_name, estimated_value_gnf | crm_leads | leadId |
| `emitCrmQuoteCreated` | quote_number, client_id, status | crm_quotes | quoteId |
| `emitCrmQuoteStatusUpdated` | from_status, to_status, quote_number | crm_quotes | quoteId |

### 3.2 Lifecycle publisher

```
publishOfficialErpEvent
  → assertValidEventType
  → assertCanPublishEvent (actor + dept VENTE)
  → trace published
  → persistEventBusAudit (category event)
  → dispatch (0 handler prod)
```

### 3.3 Cohérence avec convert

- Même `departmentKey: VENTE`
- Payload snake_case (aligné audit snapshots)
- `correlationId` = entityId métier
- Nouveaux types utilisent `crm_quotes` / `crm_leads` (aligné audit tables)

---

## 4. Mutation integration plan

Fichier : `foundation/crm-mutation-integration-plan.ts`

### 4.1 Règle de câblage P1.1

```
gate → DB success → publisher → recordCrmGovernanceAudit → return
```

### 4.2 Table intégration (résumé)

| Phase | Mutation | Publisher |
|-------|----------|-----------|
| **done** | convertCrmQuoteToSale | convert_requested, converted, failed |
| **p1_ready** | createCrmLead | emitCrmLeadCreated |
| **p1_ready** | createCrmQuote | emitCrmQuoteCreated |
| **p1_ready** | updateCrmQuoteStatus | emitCrmQuoteStatusUpdated |
| **later** | 6 autres | P2 taxonomy |

### 4.3 Future handlers (non buildés)

| Event pattern | Handler futur |
|---------------|---------------|
| `crm.lead.created` | notification-crm-lead, cockpit-vente-refresh |
| `crm.quote.created` | notification-crm-quote |
| `crm.quote.status_updated` | automation-quote-accepted |

---

## 5. Legacy coexistence strategy

Fichier : `foundation/crm-legacy-coexistence.ts`

| Legacy | Conserver jusqu'à | Condition retrait |
|--------|-------------------|-------------------|
| `recordCrmGovernanceAudit` | P3 | Handler audit_bridge validé 30j |
| `tryCreateAlert` approval | P3 | notification-approval-bridge |
| `revalidatePath` | Indéfini | Technique — OK parallèle |

**Règle absolue :** handler validé **avant** retirement legacy.

### Roadmap coexistence

1. **P1** — taxonomy + publishers (fait)
2. **P1.1** — câblage 3 mutations
3. **P2** — notification bridge
4. **P3** — retrait alerts progressif
5. **P4** — audit bridge optionnel

---

## 6. Event readiness validation

| Critère | Verdict |
|---------|---------|
| Taxonomy cohérente (pattern lock) | ✅ PASS |
| Collisions noms | ✅ PASS — aucun doublon |
| Payload consistency | ✅ PASS — snake_case, champs métier |
| Observability | ✅ PASS — trace + audit event |
| Auditability | ✅ PASS — legacy conservé |
| Ownership vente-crm | ✅ PASS |

### Verdict readiness

# **READY** pour P1.1 (câblage mutations)

**NOT READY** pour production notification/automation (handlers absents — attendu).

---

## 7. Améliorations livrées P1

| Artefact | Chemin |
|----------|--------|
| Taxonomy +3 | `event-taxonomy.ts` |
| Publishers +3 | `integrations/crm-events.ts` |
| Design map | `governance/crm-publisher-design-map.ts` |
| Integration plan | `foundation/crm-mutation-integration-plan.ts` |
| Legacy strategy | `foundation/crm-legacy-coexistence.ts` |
| Catalog p1-v1 | `event-catalog-governance.ts` |
| Migration plan update | `crm-event-migration-plan.ts` |
| Tests | `tests/unit/p1-crm-event-expansion.test.ts` |

**Non modifié :** `crm-mutations.ts`, approval engine, bus core, Finance.

---

## 8. Risques restants

1. entityType `crm_quote` vs `crm_quotes` sur convert (harmonisation P2)
2. Câblage P1.1 sans tests e2e publish trace
3. Volume events × audit double jusqu'à P3

---

## 9. Dette restante

- Câblage P1.1 (3 mutations)
- Handlers prod = 0
- 6 mutations CRM P2 taxonomy
- Finance events
- Notification/automation build

---

## 10. Prochaines priorités

| Priorité | Phase | Action |
|----------|-------|--------|
| **Immédiate** | P1.1 | Câbler emit* dans crm-mutations (3 fonctions) |
| P2 | notification bridge | Handler read-only sur `crm.*` + `approval.*` |
| P3 | alerts migration | Remplacer tryCreateAlert approval |
| P4 | finance events | Quand writes activés |
| P5 | handler bootstrap | Boot serveur register handlers |

---

## 11. Critères validation P1

| Critère | ✅ |
|---------|---|
| CRM audit produit | ✅ |
| Taxonomy amendée | ✅ |
| Événements gouvernés | ✅ |
| Publisher design défini | ✅ |
| Integration plan défini | ✅ |
| Coexistence legacy définie | ✅ |
| Readiness validée | ✅ |
| Rapport final produit | ✅ |
| Sans rebuild / chaos | ✅ |

---

## 12. Verdict final

# P1 CRM EVENT EXPANSION — **VALIDÉ**

Le bus passe de **quote-centric** à **CRM event foundation gouvernée** — prêt pour câblage incrémental P1.1.

---

*Foundation First — gouverner avant de coder les mutations.*
