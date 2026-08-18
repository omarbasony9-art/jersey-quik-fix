#!/usr/bin/env bash
# ── Jersey Quik Fix — Cloudflare deploy script ────────────────────────────────
# Run this from the jersey-quik-fix/ directory on any machine with wrangler
# authenticated (run `wrangler login` first if needed).
#
# What this does:
#   1. Creates the R2 image bucket (skipped if it already exists)
#   2. Applies pending D1 schema + seed migrations
#   3. Builds the Vite frontend (bundles the 181 product SVGs/images)
#   4. Deploys the Cloudflare Worker

set -e
cd "$(dirname "$0")"   # always run from jersey-quik-fix/

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Jersey Quik Fix — Cloudflare deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: R2 bucket ─────────────────────────────────────────────────────────
echo ""
echo "▶ Step 1/4 — Creating R2 bucket (skipped if already exists)..."
npx wrangler r2 bucket create jqf-product-images 2>&1 \
  | grep -v "already exists" || true
echo "  ✓ R2 bucket ready"

# ── Step 2: D1 migrations ─────────────────────────────────────────────────────
echo ""
echo "▶ Step 2/4 — Applying D1 migrations..."
cd artifacts/cf-worker
npx wrangler d1 migrations apply jersey-quik-fix-d1 --remote
echo "  ✓ Migrations applied (schema + 169 products seeded)"
cd ../..

# ── Step 3: Build frontend ────────────────────────────────────────────────────
echo ""
echo "▶ Step 3/4 — Building frontend..."
pnpm --filter @workspace/gamevault run build
echo "  ✓ Frontend built (dist/public ready, 181 product images bundled)"

# ── Step 4: Deploy Worker ─────────────────────────────────────────────────────
echo ""
echo "▶ Step 4/4 — Deploying Cloudflare Worker..."
cd artifacts/cf-worker
npx wrangler deploy
cd ../..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅  Deployed!  https://jersey-quik-fix.jersey-quik-fix.workers.dev"
echo ""
echo "  Shop:   /shop      → shows 169 seeded products + images"
echo "  Admin:  /admin     → create/edit products → appear on shop after save"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
