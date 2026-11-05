// Runs the real installer against throwaway projects (npm install skipped) and checks the result.
import { readFileSync, existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { strict as assert } from "node:assert";

const hook = readFileSync("integrations/nextjs/hooks/claude-stop.mjs", "utf8");
assert.ok(hook.includes("stop_hook_active"), "Claude hook needs reentry guard");
assert.ok(hook.includes("status === 3"), "Claude hook must not block on NOT CONFIGURED");

function project(extra = {}) {
  const dir = mkdtempSync(join(tmpdir(), "fv-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "t", scripts: {}, dependencies: { next: "16.0.0" }, ...extra }));
  writeFileSync(join(dir, "tsconfig.json"), "{}");
  return dir;
}
const install = (dir, ...flags) => spawnSync("node", ["integrations/nextjs/install.mjs", dir, "--skip-install", ...flags], { encoding: "utf8" });

// 1. plain project: toy example + vitest config, the effective assets, no z3/e2e
let dir = project();
let r = install(dir);
assert.equal(r.status, 0, r.stderr);
for (const f of ["docs/BUG-CLASSES.md", "scripts/mutation-checklist.md", "templates/model-based.test.template.ts", "templates/contract.template.json", "verification/verify.mjs", "verification/vitest.config.ts", ".github/workflows/formal-verification.yml"])
  assert.ok(existsSync(join(dir, f)), `missing ${f}`);
assert.ok(!existsSync(join(dir, "verification/formal")) && !existsSync(join(dir, "verification/e2e")), "z3/e2e must be opt-in");
let wf = readFileSync(join(dir, ".github/workflows/formal-verification.yml"), "utf8");
assert.ok(!wf.includes("playwright") && !wf.includes("fv:formal") && !wf.includes("setup-python"), "workflow must not contain optional steps");
assert.ok(!wf.includes("# --"), "no leftover markers");
let pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
assert.equal(pkg.scripts["fv:check"], "node verification/verify.mjs");
assert.ok(!pkg.scripts["fv:formal"] && !pkg.scripts["fv:e2e"]);

// 2. opt-ins
dir = project();
r = install(dir, "--with-z3", "--with-e2e");
assert.equal(r.status, 0, r.stderr);
wf = readFileSync(join(dir, ".github/workflows/formal-verification.yml"), "utf8");
assert.ok(wf.includes("playwright") && wf.includes("fv:formal") && !wf.includes("# --"));

// 3. jest project keeps jest: no vitest/toy example
dir = project({ devDependencies: { jest: "^30.0.0" } });
r = install(dir);
assert.equal(r.status, 0, r.stderr);
assert.ok(!existsSync(join(dir, "verification/vitest.config.ts")) && !existsSync(join(dir, "verification/tests")), "jest projects get no vitest/toy example");

// 4. refuses conflicts before touching anything, never overwrites
dir = project();
assert.equal(install(dir).status, 0);
r = install(dir);
assert.equal(r.status, 2, "second install must refuse");
assert.ok(r.stderr.includes("Refusing to overwrite"));

// 5. fv:check is NOT a pass when nothing project-specific is configured (exit 3)
dir = project({ scripts: { lint: undefined } });
writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "t", scripts: {}, dependencies: { next: "16.0.0" } }));
const noTsc = readFileSync("integrations/nextjs/verify.mjs", "utf8");
assert.ok(noTsc.includes("process.exit(3)") && noTsc.includes("NOT CONFIGURED"));

console.log("PASS installer self-tests (real installs into temp projects)");
