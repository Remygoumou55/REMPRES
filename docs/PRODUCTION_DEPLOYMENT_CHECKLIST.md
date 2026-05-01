# Production Deployment Checklist

## Build and Runtime
- Install dependencies and run `npm run build`.
- Start once with `npm run start` and validate no runtime crash on boot.
- Confirm no raw `console.log` in application runtime paths (scripts excluded).

## Environment Variables
- Configure `NEXT_PUBLIC_SUPABASE_URL`.
- Configure `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Configure `SUPABASE_SERVICE_ROLE_KEY` (server-only).
- Configure `NEXT_PUBLIC_APP_URL` to production domain.

## Database Migrations
- Apply `028_sales_transaction_hardening.sql`.
- Apply `029_currency_rpc_null_failure_hardening.sql`.
- Apply `030_performance_indexes_and_logs.sql`.

## Security Checks
- Confirm RLS enabled on business tables.
- Confirm API routes requiring auth return 401 when unauthenticated.
- Confirm no sensitive fields are written to logs.

## Critical Flows Smoke Test
- Login / logout.
- Create sale end-to-end.
- Currency conversion (GNF <-> USD/EUR/XOF).
- Product creation and listing.
- Admin users page loading.

## Observability Checks
- Trigger controlled error and confirm structured log output.
- Confirm `warn` / `error` logs are persisted in `public.logs`.
- Verify `public.logs` read access is admin-only.

## Performance Checks
- Verify search inputs remain responsive with debounce.
- Verify admin users page lazy load fallback appears quickly.
- Verify hot query indexes exist (`sales`, `products`, `currency_rates`).

## Post-Deploy Monitoring (first 24h)
- Watch auth errors, sale creation errors, and currency conversion warnings.
- Track average response times for `/api/currency/refresh` and sales actions.
- Review `public.logs` volume and adjust retention strategy if needed.

## Monetization Prep (future-safe)
- Keep user role and module usage events in logs metadata.
- Add usage counters per module for future plan limits.
- Add billing hooks behind feature flags (no impact on current logic).
