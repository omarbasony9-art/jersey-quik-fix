---
name: JQF image proxy path
description: Product images must be served under /api/ prefix or JQF frontend won't proxy them to the API server
---

## Rule
All static assets served by the API server that the JQF frontend needs to load must be mounted at `/api/*` paths (e.g. `/api/product-images/`), **not** at root-level paths like `/product-images/`.

**Why:** The JQF frontend (`jersey-quik-fix/artifacts/gamevault`) sets `VITE_API_BASE_URL=/api`. Vite's proxy only forwards requests that start with `/api` to the API server (port 8080). Requests to `/product-images/xxx.jpg` go to the Vite dev server instead, returning 404.

**How to apply:**
- In `artifacts/api-server/src/app.ts`: mount static image serving at `app.use("/api/product-images", ...)`, not `/product-images`.
- In any script that writes image URLs to the DB: use `/api/product-images/{sku}.ext` as the path prefix.
- When adding other new static assets served by the API: always prefix with `/api/`.
