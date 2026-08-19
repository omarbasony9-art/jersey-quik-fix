import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(scriptDirectory, "..");
const workerConfigPath = join(repositoryRoot, "artifacts", "cf-worker", "wrangler.toml");
const frontendConfigPath = join(repositoryRoot, "artifacts", "gamevault", "wrangler.jsonc");
const productionWorkerName = "jersey-quik-fix";
const frontendPreviewWorkerName = "jersey-quik-fix-frontend-preview";

const activeLines = (source) =>
  source
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith("#"))
    .join("\n");

const workerConfig = activeLines(readFileSync(workerConfigPath, "utf8"));
const failures = [];

const requireMatch = (label, expression) => {
  if (!expression.test(workerConfig)) failures.push(label);
};

requireMatch(
  "production Worker name",
  new RegExp(`^name\\s*=\\s*"${productionWorkerName}"\\s*$`, "m"),
);
requireMatch("Worker entrypoint", /^main\s*=\s*"src\/index\.ts"\s*$/m);
requireMatch(
  "D1 DB binding",
  /^\[\[d1_databases\]\][\s\S]*?^binding\s*=\s*"DB"\s*$/m,
);
requireMatch(
  "ASSETS binding",
  /^\[assets\][\s\S]*?^binding\s*=\s*"ASSETS"\s*$/m,
);
requireMatch(
  "PRODUCT_IMAGES R2 binding",
  /^\[\[r2_buckets\]\][\s\S]*?^binding\s*=\s*"PRODUCT_IMAGES"\s*$/m,
);
requireMatch(
  "/api/* Worker-first routing",
  /^run_worker_first\s*=\s*\[\s*"\/api\/\*"\s*\]\s*$/m,
);
requireMatch("required secrets declaration", /^\[secrets\]\s*$/m);

for (const secretName of ["ADMIN_PASSWORD", "SESSION_SECRET", "CLERK_SECRET_KEY"]) {
  requireMatch(
    `${secretName} required secret declaration`,
    new RegExp(`"${secretName}"`),
  );
}

let frontendConfig;
try {
  frontendConfig = JSON.parse(readFileSync(frontendConfigPath, "utf8"));
} catch {
  failures.push("valid frontend preview Wrangler JSON configuration");
}

if (frontendConfig?.name !== frontendPreviewWorkerName) {
  failures.push(`frontend preview Worker name (${frontendPreviewWorkerName})`);
}

if (frontendConfig?.name === productionWorkerName) {
  failures.push("separate frontend preview Worker identity");
}

if (failures.length > 0) {
  console.error("Production Worker configuration check failed:");
  for (const failure of failures) console.error(`- Missing or invalid: ${failure}`);
  process.exit(1);
}

console.log(
  `Production Worker configuration verified for ${productionWorkerName}; frontend preview is ${frontendPreviewWorkerName}.`,
);