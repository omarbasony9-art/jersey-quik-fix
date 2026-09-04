#!/usr/bin/env bash
# ── Jersey Quik Fix — Cloudflare Worker staging script ────────────────────────
# Run this from the jersey-quik-fix/ directory. It builds the storefront and
# uploads a non-live Worker version from artifacts/cf-worker only.
# Review the staged version's bindings before separately moving traffic.

set -euo pipefail
cd "$(dirname "$0")"   # always run from jersey-quik-fix/

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Jersey Quik Fix — Cloudflare Worker staging"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Build frontend ────────────────────────────────────────────────────
echo ""
echo "▶ Step 1/2 — Building frontend..."
pnpm --filter @workspace/gamevault run build
echo "  ✓ Frontend built"

# ── Step 2: Upload a staged Worker version ────────────────────────────────────
echo ""
echo "▶ Step 2/2 — Validating and staging Cloudflare Worker..."
pnpm --filter @workspace/cf-worker run stage -- "$@"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Staged version uploaded with no production traffic moved."
echo ""
echo "  Inspect the version bindings and /api/products before using"
echo "  'wrangler versions deploy <version-id>@100' from artifacts/cf-worker."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
