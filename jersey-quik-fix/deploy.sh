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
node scripts/verify-production-worker-config.mjs

if rg -i 'https?://[^"[:space:]]*(render\.com|onrender\.com)' artifacts/gamevault/dist/public; then
  echo "Production build contains a legacy Render API URL." >&2
  exit 1
fi

secrets_file="$(mktemp /tmp/jqf-worker-secrets.XXXXXX.json)"
trap 'rm -f "$secrets_file"' EXIT
chmod 600 "$secrets_file"
node -e '
  const fs = require("node:fs");
  const keys = ["ADMIN_PASSWORD", "CLERK_SECRET_KEY", "SESSION_SECRET", "STRIPE_SECRET_KEY"];
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`Missing required deployment secrets: ${missing.join(", ")}`);
    process.exit(1);
  }
  fs.writeFileSync(
    process.argv[1],
    JSON.stringify(Object.fromEntries(keys.map((key) => [key, process.env[key]]))),
    { mode: 0o600 },
  );
' "$secrets_file"
pnpm --dir artifacts/cf-worker exec wrangler versions upload \
  --config wrangler.toml \
  --keep-vars \
  --secrets-file "$secrets_file" \
  "$@"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Staged version uploaded with no production traffic moved."
echo ""
echo "  Copy the exact Version ID and Version Preview URL above, then use:"
echo "  scripts/promote-production-worker.sh <version-id> <version-preview-url>"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
