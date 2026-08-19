---
name: Cloudflare Worker deployment
description: Key lessons and blockers from deploying the jersey-quik-fix CF Worker with D1 + Assets
---

## Rules

**`run_worker_first = true` is mandatory in `[assets]`**
Without it, Cloudflare's SPA mode intercepts every GET /api/* request and returns index.html. The Worker code never runs for GET. POST requests are unaffected (no SPA fallback for non-GET). This was the root cause of "0 products" on the live site.

**Why:** Cloudflare serves static assets before running the Worker script by default. `run_worker_first` reverses the priority.

**How to apply:** Always include this in `wrangler.toml` `[assets]` section for any SPA + API Worker combo.

**Use Wrangler 4.123.0 or newer for Worker-first asset routing.**
Wrangler 3.x silently omitted the `run_worker_first` option from deployed Worker metadata, leaving `raw_run_worker_first: false` even when the TOML contained the setting. Use the API-only form `run_worker_first = ["/api/*"]` to keep storefront paths asset-first.

**Why:** A Worker with static SPA assets can return `200 text/html` for API URLs when old Wrangler deploys it, making a JSON client appear to have an empty catalog.

**How to apply:** Before relying on this routing configuration, verify the deployed version metadata reports `raw_run_worker_first: ["/api/*"]`, then curl `/api/products?limit=200` and confirm `application/json`.

**Preserve Dashboard-managed ordinary Worker variables during Wrangler deployments.**
Set `keep_vars = true` when the source configuration intentionally omits existing Dashboard-managed non-secret variables. Do not rely on it to protect secret bindings.

**Why:** `keep_vars` preserves ordinary Dashboard variables, while Worker secrets must be declared and staged explicitly. A version can otherwise go live without a required `secret_text` binding even though the underlying password and database data were never changed.

**How to apply:** Declare the required secret names in `[secrets]`, stage them with `wrangler versions upload --secrets-file`, and verify `ADMIN_PASSWORD`, `SESSION_SECRET`, and other required `secret_text` bindings with `wrangler versions view <version> --json` before moving production traffic.

## D1 Seed Files

**Large seed SQL fails with `SQLITE_TOOBIG`** when applied via `wrangler d1 migrations apply`.

**Why:** The migration runner sends the whole file as one statement. D1 has a max statement size.

**Fix:** Use the D1 REST API directly in batches of ~20 rows:
```
POST https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{database_id}/query
{ "sql": "INSERT OR IGNORE INTO ... VALUES (...)", "params": [] }
```
Then manually mark the migration as applied:
```sql
INSERT OR IGNORE INTO d1_migrations (name, applied_at) VALUES ('0003_seed_products.sql', datetime('now'))
```

## R2

- R2 must be enabled in the Cloudflare dashboard **before** any `[[r2_buckets]]` binding can be used.
- Error code `10042` = "Please enable R2 through the Cloudflare Dashboard"
- Error code `10085` = R2 bucket not found (bucket name wrong or doesn't exist yet)
- Make `PRODUCT_IMAGES?: R2Bucket` optional in types.ts and guard all `c.env.PRODUCT_IMAGES` calls to allow deployment without R2.

## Wrangler Auth

Set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` env vars — wrangler picks them up automatically, no `wrangler login` needed.

## Edge Cache

After deploying with `run_worker_first`, old GET /api/* responses may remain cached at the edge (`cf-cache-status: HIT`). Headers are `max-age=0, must-revalidate` so they clear quickly. Use `Cache-Control: no-cache` request header to bypass immediately.

## Data Architecture

- **Production data**: D1 (1e526c4e-aa64-4efb-9e52-b8028af7fba0) in jersey-quik-fix Cloudflare account
- **Replit preview data**: PostgreSQL (artifacts/api-server)
- Admin edits at Replit preview URL → PostgreSQL (does NOT affect live CF site)
- Admin edits at CF workers.dev URL → D1 (affects live CF site)
- The two databases are separate; seed SQL was exported from PostgreSQL → applied to D1
