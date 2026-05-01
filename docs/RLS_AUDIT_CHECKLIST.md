# RLS Audit Checklist (Admin / Manager / Agent)

This checklist validates RLS consistency and effective access behavior after:

- `022_rls_roles_policies_hardening.sql`
- `023_rls_sales_security_completion.sql`
- `024_rls_audit_verification.sql` (read-only checks)

## 1) SQL Structural Audit (run first)

- Run `supabase/sql/024_rls_audit_verification.sql`.
- Confirm all target tables have `rls_enabled = true`:
  - `clients`, `products`, `sales`, `sale_items`, `stock_movements`,
  - `expenses`, `sales_archive`, `financial_transactions`,
  - `currency_rates`, `expense_categories`.
- Confirm required helper functions exist and are `security_definer`:
  - `is_super_admin()`
  - `current_user_canonical_role()`
  - `is_admin_role()`
  - `user_has_module_permission(module_name, action_name)`
- Confirm permission matrix rows exist for `admin`, `manager`, `agent` on:
  - `clients`, `produits`, `vente`, `finance` (and `admin` for admin role).
- Confirm no duplicate policy names per table/command.

## 2) Role Mapping Validation

Validate canonical mapping using real profiles:

- `super_admin`, `admin`, `directeur_general` -> `admin`
- `manager`, `responsable_vente`, `comptable`, etc. -> `manager`
- everything else -> `agent`

Expected behavior:

- Admin-only routes available to canonical `admin`.
- Manager/agent denied on:
  - `/admin/users`
  - `/admin/currency`
  - `/admin/archives`

## 3) Functional Access Tests by Role

Perform these tests with 3 separate users (or impersonation):

- `admin_user`
- `manager_user`
- `agent_user`

Use seeded data where each user has at least one record they created.

### A. Clients

- **Admin**
  - Can list all active clients.
  - Can create client.
  - Can update any client.
  - Can soft-delete client.
- **Manager**
  - Can list only own clients.
  - Can create client.
  - Can update own clients.
  - Cannot delete unless permission matrix allows delete.
- **Agent**
  - Can list only own clients.
  - Can create client.
  - Cannot update/delete unless explicitly granted.

### B. Products

- **Admin**
  - Full read/create/update/delete on products.
- **Manager**
  - Read/create/update own products per matrix.
- **Agent**
  - Read own products only if allowed by matrix and ownership rule.
  - No write unless explicitly granted.

### C. Sales + Sale Items + Stock Movements

- **Admin**
  - Can read all active sales.
  - Can create sales and related sale items.
  - Can update/cancel/archive according to module permissions.
- **Manager / Agent**
  - Read limited to own sales (`created_by` or `seller_id`) with read permission.
  - Insert only with `vente:create`.
  - Update/delete blocked unless matching permission + ownership.

### D. Expenses + Financial Transactions

- **Admin**
  - Full finance access according to matrix.
- **Manager**
  - Read/create/update own finance records according to matrix.
- **Agent**
  - Denied if finance permissions are false.

### E. Currency Rates / Admin Finance Controls

- Non-admin users cannot access admin currency screens or admin APIs.
- Admin can access and refresh rates.

## 4) Frontend Guard Validation

Validate UI and route behavior:

- Sidebar/menu hides admin entries for manager/agent.
- Direct URL access by manager/agent to admin pages redirects to `/access-denied`.
- Authenticated admin reaches admin pages without redirect loops.
- Unauthenticated user on protected route redirects to `/login?next=...`.

## 5) Negative Security Tests

- Manager tries to update/delete another user's client/product -> denied.
- Agent tries to read another user's sales -> denied.
- Non-admin calls `/api/admin/users` -> HTTP 403.
- Non-admin calls activity log export/verify endpoints -> HTTP 403.

## 6) Regression / Stability Checks

- Switch rapidly between `/vente/clients`, `/vente/produits`, `/vente/nouvelle-vente`, `/vente/historique`.
- Confirm no UI freeze and no auth redirect loops.
- Validate create/update/delete flows still return user-friendly errors.

## 7) Sign-off Criteria

Mark release-ready only when all are true:

- Structural SQL audit has no blocking findings.
- Functional tests pass for `admin`, `manager`, `agent`.
- Negative tests return proper denial.
- No route guard bypass detected.
- No freeze/regression in `vente` navigation.
