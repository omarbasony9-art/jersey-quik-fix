---
name: Distributed Worker rate limits
description: Deterministic abuse protection across Cloudflare Worker isolates and preview traffic.
---

Use hashed D1-backed fixed-window counters as the deterministic enforcement layer for sensitive public endpoints. Native Cloudflare rate-limit bindings and isolate-local memory can remain as defense in depth, but should not be the only controls.

**Why:** Consecutive requests can cross Worker isolates, and native binding enforcement is location-local and approximate; version-preview traffic did not trip it predictably. Isolate-local maps likewise allowed bursts to escape enforcement.

**How to apply:** Hash the client key before persistence, use an atomic upsert that resets expired windows or increments active ones, return Retry-After with 429, and test the staged endpoint until it deterministically reaches the configured limit.