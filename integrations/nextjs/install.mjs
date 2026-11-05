#!/usr/bin/env node
/**
 * Install reusable verification assets into an existing Next.js/TypeScript npm project.
 *
 * Usage: node integrations/nextjs/install.mjs /absolute/path/to/project [--with-z3] [--with-e2e] [--skip-install]
 *   --with-z3       add the optional Z3 symbolic example (python3 + z3-solver) and its CI steps
 *   --with-e2e      add the optional Playwright smoke test and its CI steps
 *   --skip-install  copy files and scripts only; do not run npm install
 * Existing jest projects keep jest (vitest and the toy example are NOT installed); fast-check is added.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const here = join(root, "integrations/nextjs");
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith("--")));
const targetArg = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!targetArg) { console.error("Usage: node integrations/nextjs/install.mjs /absolute/path/to/nextjs-project [--with-z3] [--with-e2e] [--skip-install]"); process.exit(2); }
const target = resolve(targetArg);
const packagePath = join(target, "package.json");
if (!isAbsolute(targetArg) || !existsSync(packagePath)) {
  console.error("Provide an absolute path to an existing npm Next.js project");
  process.exit(2);
}
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
if (!deps.next) { console.error("The target must include 'next' as a dependency"); process.exit(2); }
if (!existsSync(join(target, "tsconfig.json"))) { console.error("TypeScript project required: missing tsconfig.json"); process.exit(2); }

const usesJest = Boolean(deps.jest) || readdirSync(target).some((f) => /^jest\.config\./.test(f));
const withZ3 = flags.has("--with-z3");
const withE2e = flags.has("--with-e2e");

// [source, destination, mode]  mode: "hard" = refuse on conflict, "soft" = skip if it already exists
const mapping = [
  [join(root, ".agents/skills/formal-verification/SKILL.md"), ".agents/skills/formal-verification/SKILL.md", "soft"],
  [join(root, ".claude/skills/formal-verification/SKILL.md"), ".claude/skills/formal-verification/SKILL.md", "soft"],
  [join(root, "AGENTS.md"), "AGENTS.md", "soft"],
  [join(root, "CLAUDE.md"), "CLAUDE.md", "soft"],
  // the parts that actually find money/permission bugs
  [join(root, "docs/BUG-CLASSES.md"), "docs/BUG-CLASSES.md", "soft"],
  [join(root, "scripts/verify-contract.mjs"), "scripts/verify-contract.mjs", "soft"],
  [join(root, "scripts/mutation-checklist.md"), "scripts/mutation-checklist.md", "soft"],
  [join(root, "templates/contract.template.json"), "templates/contract.template.json", "soft"],
  [join(root, "templates/evidence-report.template.md"), "templates/evidence-report.template.md", "soft"],
  [join(root, "templates/model-based.test.template.ts"), "templates/model-based.test.template.ts", "soft"],
  [join(here, "spec.template.json"), "verification/spec.template.json", "hard"],
  [join(here, "claude-stop-hook.example.json"), "verification/claude-stop-hook.example.json", "hard"],
  [join(here, "hooks/claude-stop.mjs"), "verification/hooks/claude-stop.mjs", "hard"],
  [join(here, "verify.mjs"), "verification/verify.mjs", "hard"],
];
if (!usesJest) {
  mapping.push(
    [join(here, "examples/transfer.ts"), "verification/examples/transfer.ts", "hard"],
    [join(here, "tests/transfer.property.test.ts"), "verification/tests/transfer.property.test.ts", "hard"],
    [join(here, "vitest.config.ts"), "verification/vitest.config.ts", "hard"],
  );
}
if (withZ3) mapping.push(
  [join(here, "formal/transfer_proof.py"), "verification/formal/transfer_proof.py", "hard"],
  [join(here, "requirements.txt"), "verification/requirements.txt", "hard"],
);
if (withE2e) mapping.push(
  [join(here, "playwright.config.ts"), "verification/playwright.config.ts", "hard"],
  [join(here, "e2e/health.spec.ts"), "verification/e2e/health.spec.ts", "hard"],
);
const workflowDest = ".github/workflows/formal-verification.yml";
mapping.push([null, workflowDest, "hard"]);

const scripts = { "fv:check": "node verification/verify.mjs" };
if (withZ3) scripts["fv:formal"] = "python3 verification/formal/transfer_proof.py";
if (withE2e) scripts["fv:e2e"] = "playwright test -c verification/playwright.config.ts";

// Refuse any conflicts before touching the target.
const collisions = mapping.filter(([, dest, mode]) => mode === "hard" && existsSync(join(target, dest))).map(([, dest]) => dest);
for (const name of Object.keys(scripts)) {
  if (pkg.scripts?.[name] && pkg.scripts[name] !== scripts[name]) collisions.push(`script:${name}`);
}
if (collisions.length) { console.error("Refusing to overwrite existing content:", collisions.join(", ")); process.exit(2); }

const stripMarkers = (text) => {
  let out = text;
  if (!withZ3) out = out.replace(/ *# --z3\n[\s\S]*?# --end-z3\n/g, "");
  if (!withE2e) out = out.replace(/ *# --e2e\n[\s\S]*?# --end-e2e\n/g, "");
  return out.replace(/ *# --(end-)?(z3|e2e)\n/g, "");
};

for (const [source, dest] of mapping) {
  const dst = join(target, dest);
  if (existsSync(dst)) { console.log("SKIP", dest); continue; }
  mkdirSync(dirname(dst), { recursive: true });
  if (source === null) writeFileSync(dst, stripMarkers(readFileSync(join(here, "workflow.yml"), "utf8")));
  else copyFileSync(source, dst);
  console.log("ADD", dest);
}

const devDeps = ["fast-check@^4.3.0"];
if (!usesJest) devDeps.push("vitest@^3.2.4");
if (withE2e) devDeps.push("@playwright/test@^1.56.0");
if (!flags.has("--skip-install")) {
  const install = spawnSync("npm", ["install", "--save-dev", ...devDeps], { cwd: target, stdio: "inherit" });
  if (install.error || install.status !== 0) {
    console.error("Dependency install failed; run npm install --save-dev " + devDeps.join(" ") + " in the project manually.");
    process.exit(install.status || 1);
  }
}
const updated = JSON.parse(readFileSync(packagePath, "utf8"));
updated.scripts = { ...updated.scripts, ...scripts };
writeFileSync(packagePath, JSON.stringify(updated, null, 2) + "\n");

console.log(`\nInstalled (${usesJest ? "jest project: vitest/toy example skipped" : "vitest + toy example"}).`);
console.log("IMPORTANT: npm run fv:check reports NOT CONFIGURED (exit 3) until you add a script \"fv:project\" that runs YOUR verification");
console.log("(model-based / money / permission tests; start from templates/model-based.test.template.ts). Optional \"fv:fast\" = quick subset for the Stop hook.");
console.log("Next: copy templates/contract.template.json to specs/<id>.json, fill it, node scripts/verify-contract.mjs specs/<id>.json --strict");
console.log("Enable the Claude Stop hook only after merging verification/claude-stop-hook.example.json into your own settings. Branch protection must be configured in GitHub.");
