---
name: Running TS scripts via esbuild in this monorepo
description: How to execute one-off TypeScript scripts in the api-server without tsx being installed
---

## Rule
`tsx` and `ts-node` are not installed in this monorepo. To run a TypeScript script from `artifacts/api-server/src/lib/`:

```bash
cd artifacts/api-server
node_modules/.bin/esbuild src/lib/my-script.ts \
  --bundle --platform=node --outfile=/tmp/my-script.cjs --format=cjs
node /tmp/my-script.cjs
```

**Why:** `pnpm exec tsx` fails (not found), and `npx tsx` is unreliable. `esbuild` IS available in `artifacts/api-server/node_modules/.bin/` and bundles workspace deps cleanly.

**How to apply:**
- Always `cd artifacts/api-server` before running — `process.cwd()` in the bundle resolves relative to the shell CWD, not the bundle file location.
- `__dirname` inside a CJS bundle points to the bundle's output directory (`/tmp`), not the source file. Use `process.cwd()` for path resolution, which works correctly when run from `artifacts/api-server/`.
- Use `--format=cjs` (not `esm`) for scripts that use `require`-style workspace packages.
- Use `--bundle` without `--packages=external` so workspace packages (`@workspace/db` etc.) get bundled in.
