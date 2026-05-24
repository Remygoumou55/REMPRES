# NAV OWNERSHIP REPORT — Étape 3

```
profile-authority
  → sidebar-authority
    → getSidebarForRole (AppShell)
      → ErpNavSidebar (SA, nav-config) | DepartmentBusinessSidebar (dept)
```

**Barrel :** `navigation-authority.ts`  
**super-admin-nav :** dérivé NAV_CONFIG — tests lockdown only
