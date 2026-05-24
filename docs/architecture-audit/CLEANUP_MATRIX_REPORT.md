# CLEANUP MATRIX REPORT — Bloc 2 Étape 2

Automatisé : `tests/unit/legacy-cleanup-matrix.test.ts`

| AREA | EXPECTED | ACTUAL | RESULT |
|------|----------|--------|--------|
| SA cockpit | SuperAdminCockpitClient | présent dans dashboard/page | PASS |
| SA sidebar | ErpNavSidebar | présent dans app-shell | PASS |
| Dept cockpit | DeptHomePage | dept/[deptKey]/page | PASS |
| Orphan placeholder | supprimé | fichier absent | PASS |
| VenteCockpitClient | supprimé | fichier absent | PASS |
| Admin KEEP | isAdminRouteKept | /admin/approvals true | PASS |
| Admin legacy | registry | /admin/cloud/ai false | PASS |
| Admin file | page absent | cloud/ai/page.tsx absent | PASS |
