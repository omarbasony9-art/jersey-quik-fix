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
Set `keep_vars = true` when the source configuration intentionally omits existing Dashboard-managed non-secret variables.

**Why:** `keep_vars` preserves ordinary Dashboard variables. Wrangler versions uploads treat `--secrets-file` additively: omitted existing secrets are retained and are never deleted by a deployment. Version metadata can omit these retained secret bindings even though their values remain unchanged.

**How to apply:** Keep required secret declarations in the canonical production config as a safety check. When a current-asset upload needs to retain existing secrets, stage without passing secret values, inspect the non-secret bindings and API routing, then remove any temporary staging configuration after deployment. Never read, print, or replace secret values unless a change is explicitly required.

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

## Worker Configuration Ownership

**Only deploy the `cf-worker` configuration to the `jersey-quik-fix` Worker.**
The storefront artifact also has a static-only Wrangler configuration with the same Worker name; deploying it replaces the API Worker with a version that has no D1, R2, asset API-routing, or auth bindings.

**Why:** The static-only version serves the SPA shell for `/api/*` before the Worker can run, making the catalog appear unavailable while product records remain healthy in D1.

**How to apply:** Upload from the `cf-worker` directory, inspect the staged version for `raw_run_worker_first: ["/api/*"]` plus DB, ASSETS, PRODUCT_IMAGES, and required secret bindings, then test `/api/products?limit=200` before moving traffic.

**Recover static-only production versions by restoring a verified Worker version, not by re-uploading without secrets.**
If the active version has no script bindings and serves HTML at `/api/*`, traffic can be safely returned to an earlier verified version with `wrangler versions deploy <version-id>@100`.

**Why:** A fresh version upload correctly requires secret values; bypassing that requirement risks replacing the API failure with missing authentication or payment bindings. Traffic restoration reuses the existing version and its already verified bindings without touching D1, R2, or secrets.

**How to apply:** Inspect the target with `wrangler versions view <version-id> --json`, confirm Worker-first API routing and bindings, shift only version traffic, then verify the live API returns JSON.

**A healthy API Worker can still serve a stale storefront bundle with an obsolete API base URL.**
If `/api/products` returns JSON directly but the live Store reports an HTTP 500 from another origin, the deployed static asset bundle—not D1—is stale.

**Why:** Worker code, bindings, and static assets are deployed together by version. Restoring an older API Worker may restore routing while retaining a browser bundle that still requests a retired backend.

**How to apply:** Inspect the API URL embedded in the live JavaScript bundle, stage a current full Worker version with `/api` routing and the same D1/R2/assets bindings, test its version-preview URL, then promote only after verification.

## Data Architecture

- **Production data**: D1 (1e526c4e-aa64-4efb-9e52-b8028af7fba0) in jersey-quik-fix Cloudflare account
- **Replit preview data**: PostgreSQL (artifacts/api-server)
- Admin edits at Replit preview URL → PostgreSQL (does NOT affect live CF site)
- Admin edits at CF workers.dev URL → D1 (affects live CF site)
- The two databases are separate; seed SQL was exported from PostgreSQL → applied to D1
