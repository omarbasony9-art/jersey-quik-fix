#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ $# -ne 2 || ! "$1" =~ ^[0-9a-f-]{36}$ || ! "$2" =~ ^https://[a-f0-9]{8}-jersey-quik-fix\.jersey-quik-fix\.workers\.dev/?$ ]]; then
  echo "Usage: scripts/promote-production-worker.sh <worker-version-id> <exact-version-preview-url>" >&2
  exit 2
fi

version_id="$1"
preview_url="${2%/}"
production_url="https://jerseyquikfix.com"
worker_url="https://jersey-quik-fix.jersey-quik-fix.workers.dev"

node scripts/verify-production-worker-config.mjs
pnpm --filter @workspace/gamevault run build

if rg -i 'https?://[^"[:space:]]*(render\\.com|onrender\\.com)' artifacts/gamevault/dist/public; then
  echo "Production build contains a legacy Render API URL." >&2
  exit 1
fi

node scripts/validate-production-catalog.mjs "$preview_url"
pnpm --dir artifacts/cf-worker exec wrangler versions deploy "${version_id}@100" --config wrangler.toml --yes
node scripts/validate-production-catalog.mjs "$production_url" "$worker_url"