---
name: Worker asset fallback order
description: How to combine Worker-first routing, exact static assets, SPA allowlists, and real 404 responses safely.
---

With Worker-first asset routing and the asset binding configured not to perform its own SPA fallback, reject reserved or dotfile paths first, then fetch the exact bundled asset, then reject missing executable-looking paths, and only then apply the explicit SPA route allowlist.

**Why:** Rejecting executable-looking extensions before the exact asset lookup also rejects the application's legitimate hashed JavaScript bundle, leaving every route as a blank page. Letting the asset binding perform its own SPA fallback instead causes arbitrary unknown routes to return index HTML with status 200.

**How to apply:** Whenever changing frontend fallback or suspicious-path logic, verify a real hashed JS and CSS asset returns 200, an allowlisted client route returns 200, and both a missing JS file and an unknown extensionless route return 404.