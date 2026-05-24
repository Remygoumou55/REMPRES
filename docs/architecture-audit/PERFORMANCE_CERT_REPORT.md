# PERFORMANCE CERTIFICATION — Étape 5

**Verdict :** CERTIFIED (no regression)

## Matrix Étape 4 revalidée

| AREA | BEFORE | AFTER | RESULT |
|------|--------|-------|--------|
| Sidebar mount desktop | 2 | 1 | improved |
| shellRail default | new object | EMPTY_SHELL_RAIL | improved |
| sidebarProps | inline | useMemo | improved |
| CurrencySwitcher | static | dynamic | improved |
| layout-access | cache() | cache() | neutral |
| shell i18n | 3 bundles | 3 bundles | neutral |
| middleware | 83.2 kB | 83.2 kB | neutral |

Build post-cert : shared JS **87.8 kB**, middleware **83.2 kB**.

Tests : `runtime-performance-matrix` (11) — PASS.
