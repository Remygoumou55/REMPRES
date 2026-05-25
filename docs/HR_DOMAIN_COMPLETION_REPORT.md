# HR DOMAIN COMPLETION — Bloc 3 Étape 1

**Date :** 22 mai 2026  
**Verdict :** `ACTIVE`

**Super Admin :** zone gelée — `ErpNavSidebar`, `SuperAdminCockpitClient`, `/dashboard` **non modifiés**.

---

## 1. Contexte

Post-Bloc 1 (SECURITY) et Bloc 2 (ARCHITECTURE CERTIFIED). Mission : compléter le domaine RH en ERP opérationnel — pas de démo ni placeholder.

---

## 2. Employee lifecycle

| Capacité | Implémentation |
|----------|----------------|
| Profil SoT | `profiles` + `rh_employee_history` |
| Rôle / département | `updateHrEmployeeRole` + bus `hr.employee.updated` |
| Manager / hiérarchie | `rh_employee_hierarchy` + history |
| Statut emploi | `updateHrEmployeeEmploymentStatus` + `hr.employee.status_changed` |
| UI | `EmployeeStatusForm` dans `EmployeeAdminWorkspace` |

→ [`docs/hr-audit/EMPLOYEE_LIFECYCLE_REPORT.md`](hr-audit/EMPLOYEE_LIFECYCLE_REPORT.md)

---

## 3. Attendance + leave

| Capacité | Implémentation |
|----------|----------------|
| Pointage | `hr-attendance-mutations.ts` → `rh_attendance_events` |
| Bus | `hr.attendance.recorded` |
| Congés | types `annual`, `sick`, `special`, `unpaid` |
| Workflow | request → `approval_requests` → approve/reject/cancel |
| SQL sync | `047_rh_domain_completion.sql` trigger leave |
| Rejet bus | `hr.leave.rejected` + notification bridge |

→ [`docs/hr-audit/ATTENDANCE_LEAVE_REPORT.md`](hr-audit/ATTENDANCE_LEAVE_REPORT.md)

---

## 4. HR governance

- `HR_DOMAIN_GOVERNANCE` v bloc3 — leave + attendance **active**
- Write registry : `ATTENDANCE_RECORD`, `EMPLOYEE_STATUS_UPDATE`
- RBAC : `is_rh_operator()`, module `rh`, `canOperateRhDomain`

→ [`docs/hr-audit/HR_GOVERNANCE_REPORT.md`](hr-audit/HR_GOVERNANCE_REPORT.md)

---

## 5. HR event bus

**14 events HR actifs** (catalogue 33 types officiels).

Nouveaux Bloc 3 :
- `hr.attendance.recorded`
- `hr.employee.status_changed`
- `hr.leave.rejected`

→ [`docs/hr-audit/HR_EVENT_REPORT.md`](hr-audit/HR_EVENT_REPORT.md)

---

## 6. Dashboard + operations

| Surface | Route | Données |
|---------|-------|---------|
| Hub RH | `/rh` | `getRhFoundationData` live |
| Dept cockpit | `/dept/rh` | `computeRhDeptKpisLive` — **non-placeholder** |
| Collaborateurs | `/rh/collaborateurs` | EmployeeAdminWorkspace |
| Congés | `/rh/conges` | workflow complet |
| Présences | `/rh/presences` | pointage + journal |
| Contrats / recrutement | inchangés enterprise | |

→ [`docs/hr-audit/HR_OPERATIONS_REPORT.md`](hr-audit/HR_OPERATIONS_REPORT.md)

---

## 7. Performance

- Mutations gouvernées (gate → write → bus) — pas de double query shell
- KPI dept : agrégation parallèle `safeCount` / `safeData`
- Visual : `HR_VISUAL_REPOSITORY_PLACEHOLDER = false` (resolver live)

→ [`docs/hr-audit/HR_PERFORMANCE_REPORT.md`](hr-audit/HR_PERFORMANCE_REPORT.md)

---

## 8. Matrix

`tests/unit/hr-domain-completion-matrix.test.ts` — **14 PASS**

→ [`docs/hr-audit/HR_MATRIX_REPORT.md`](hr-audit/HR_MATRIX_REPORT.md)

---

## 9. Dette restante

| ID | Item | Sévérité |
|----|------|------|
| H1 | Paie complète | blocked (by design) |
| H2 | Planning shifts / retards avancés | low |
| H3 | `modules/` parallèle `app/` | medium (hors scope) |

---

## 10. Verdict

### `ACTIVE`

Domaine RH opérationnel : lifecycle, attendance, leave governance, event bus, cockpit KPIs live. Build + lint PASS. Super Admin inchangé.

Validation → [`docs/hr-audit/HR_VALIDATION_REPORT.md`](hr-audit/HR_VALIDATION_REPORT.md)
