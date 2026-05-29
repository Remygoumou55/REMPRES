# Governance — Enterprise Authorization Program

| Phase | Document | Statut |
|-------|----------|--------|
| **0** | [PHASE0-root-authority-recovery](../runtime-safety/PHASE0-root-authority-recovery.md) | Code + SQL migration `093_system_authority.sql` |
| **1** | [PHASE1-authority-architecture-audit](./PHASE1-authority-architecture-audit.md) | Audit cartographie |
| **2** | [PHASE2-root-authority-layer](./PHASE2-root-authority-layer.md) | Authorization Core + runtime unification |
| **3** | [PHASE3-immutable-root-protection](./PHASE3-immutable-root-protection.md) | Protection root immuable + audit mutations |
| **4** | [PHASE4-super-admin-isolation](./PHASE4-super-admin-isolation.md) | Control plane isolé des départements métiers |
| **5** | *À venir* | Authorization Matrix Engine |

**Inventaire reproductible :** `npm run audit:phase1` → `docs/governance/phase1-legacy-inventory.json`

**Références historiques :** `docs/RBAC_MASTER_AUDIT.md`, `docs/ROUTE_ISOLATION_REPORT.md`, `docs/runtime-safety/`
