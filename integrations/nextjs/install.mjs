#!/usr/bin/env node
/** Install reusable verification assets into an existing Next.js/TypeScript npm project. */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const here = join(root, "integrations/nextjs");
const targetArg = process.argv[2];
if (!targetArg) { console.error("Usage: node integrations/nextjs/install.mjs /absolute/path/to/nextjs-project"); process.exit(2); }
const target = resolve(targetArg);
const packagePath = join(target, "package.json");
if (!isAbsolute(targetArg) || !existsSync(packagePath)) {
  console.error("Provide an absolute path to an existing npm Next.js project");
  process.exit(2);
}
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
if (!(pkg.dependencies?.next || pkg.devDependencies?.next)) {
  console.error("The target must include 'next' as a dependency");
  process.exit(2);
}
if (!existsSync(join(target, "tsconfig.json"))) {
  console.error("TypeScript project required: missing tsconfig.json");
  process.exit(2);
}
const mapping = [
  [join(root,".agents/skills/formal-verification/SKILL.md"),".agents/skills/formal-verification/SKILL.md"],
  [join(root,".claude/skills/formal-verification/SKILL.md"),".claude/skills/formal-verification/SKILL.md"],
  [join(root,"AGENTS.md"),"AGENTS.md"],
  [join(root,"CLAUDE.md"),"CLAUDE.md"],
  [join(root,"scripts/verify-contract.mjs"),"scripts/verify-contract.mjs"],
  [join(here,"examples/transfer.ts"),"verification/examples/transfer.ts"],
  [join(here,"tests/transfer.property.test.ts"),"verification/tests/transfer.property.test.ts"],
  [join(here,"vitest.config.ts"),"verification/vitest.config.ts"],
  [join(here,"playwright.config.ts"),"verification/playwright.config.ts"],
  [join(here,"e2e/health.spec.ts"),"verification/e2e/health.spec.ts"],
  [join(here,"spec.template.json"),"verification/spec.template.json"],
  [join(here,"claude-stop-hook.example.json"),"verification/claude-stop-hook.example.json"],
  [join(here,"hooks/claude-stop.mjs"),"verification/hooks/claude-stop.mjs"],
  [join(here,"formal/transfer_proof.py"),"verification/formal/transfer_proof.py"],
  [join(here,"requirements.txt"),"verification/requirements.txt"],
  [join(here,"verify.mjs"),"verification/verify.mjs"],
  [join(here,"workflow.yml"),".github/workflows/formal-verification.yml"]
];
// Refuse any conflicts before touching the target (except existing user instructions).
const skipped = new Set(["AGENTS.md","CLAUDE.md"]);
const collisions = mapping.filter(([,dest]) => existsSync(join(target,dest)) && !skipped.has(dest)).map(([,dest])=>dest);
const scripts = {
  "fv:check": "node verification/verify.mjs",
  "fv:formal": "python3 verification/formal/transfer_proof.py",
  "fv:e2e": "playwright test -c verification/playwright.config.ts"
};
for (const name of Object.keys(scripts)) {
  if (pkg.scripts?.[name] && pkg.scripts[name] !== scripts[name]) collisions.push(`script:${name}`);
}
if (collisions.length) { console.error("Refusing to overwrite existing content:",collisions.join(", ")); process.exit(2); }
for (const [source,dest] of mapping) {
  const dst = join(target,dest);
  if (existsSync(dst)) { console.log("SKIP",dest); continue; }
  mkdirSync(dirname(dst),{recursive:true});
  copyFileSync(source,dst);
  console.log("ADD",dest);
}
const install = spawnSync("npm", ["install","--save-dev","vitest@^3.2.4","fast-check@^4.3.0","@playwright/test@^1.56.0"], { cwd:target,stdio:"inherit" });
if (install.error || install.status !== 0) {
  console.error("Dependency install failed; run npm install in the project manually.");
  process.exit(install.status || 1);
}
const updated = JSON.parse(readFileSync(packagePath,"utf8"));
updated.scripts = {...updated.scripts,...scripts};
writeFileSync(packagePath, JSON.stringify(updated,null,2)+"\n");
console.log("\nInstalled. Enable Claude Stop hook only after merging the example into your own settings.");
console.log("Next: python3 -m pip install -r verification/requirements.txt && npx playwright install chromium");
console.log("Run npm run fv:check; your CI workflow is available but branch protection must be configured in GitHub.");
