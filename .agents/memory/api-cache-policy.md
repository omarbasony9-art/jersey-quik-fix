---
name: API cache policy
description: Prevent stale SPA HTML from being served as a live Shop or Admin API response.
---

All production `/api/*` responses must carry `Cache-Control: no-store, max-age=0`.

**Why:** A static-only Worker deployment can cache the SPA HTML under a GET API URL. A later full Worker deployment then appears to have a broken route even though its application code and bindings are healthy.

**How to apply:** Keep the API-wide cache header middleware in the production Worker and verify each normal production API URL returns JSON after promotion. Do not rely only on a cache-busted URL; the Cloudflare token used for Worker deploys may not have permission to purge existing edge cache entries.