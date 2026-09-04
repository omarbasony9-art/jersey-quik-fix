import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(scriptDirectory, "..");
const workerConfigPath = join(repositoryRoot, "artifacts", "cf-worker", "wrangler.toml");
const frontendConfigPath = join(repositoryRoot, "artifacts", "gamevault", "wrangler.jsonc");
const frontendEnvPath = join(repositoryRoot, "artifacts", "gamevault", ".env.production");
const frontendSourceDirectory = join(repositoryRoot, "artifacts", "gamevault", "src");
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
  "all-request Worker-first routing",
  /^run_worker_first\s*=\s*true\s*$/m,
);
requireMatch("required secrets declaration", /^\[secrets\]\s*$/m);

for (const secretName of [
  "ADMIN_PASSWORD",
  "SESSION_SECRET",
  "CLERK_SECRET_KEY",
  "STRIPE_SECRET_KEY",
]) {
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

const productionEnv = activeLines(readFileSync(frontendEnvPath, "utf8"));
if (!/^VITE_API_BASE_URL\s*=\s*\/api\s*$/m.test(productionEnv)) {
  failures.push("same-origin production API base (/api)");
}

const legacyApiPattern = /https?:\/\/[^\s"'`]*(?:render\.com|onrender\.com)/i;
if (legacyApiPattern.test(productionEnv)) {
  failures.push("production environment without a legacy external API base");
}

const sourceFiles = [];
const walk = (directory) => {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(?:ts|tsx|js|jsx)$/.test(name)) sourceFiles.push(path);
  }
};
walk(frontendSourceDirectory);

for (const sourceFile of sourceFiles) {
  if (legacyApiPattern.test(readFileSync(sourceFile, "utf8"))) {
    failures.push("storefront source without a legacy Render API URL");
    break;
  }
}

if (failures.length > 0) {
  console.error("Production Worker configuration check failed:");
  for (const failure of failures) console.error(`- Missing or invalid: ${failure}`);
  process.exit(1);
}

console.log(
  `Production Worker configuration verified for ${productionWorkerName}; frontend preview is ${frontendPreviewWorkerName}.`,
);