// Claude Code Stop hook. Runs deterministic checks, returns feedback once.
// Do not auto-enable in existing settings; merge manually to preserve other hooks.
// - Skips when no source file changed (cheap stops).
// - Prefers the quick script `fv:fast`, else `fv:check`.
// - Exit code 3 from fv:check (NOT CONFIGURED) is a warning, never a block.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
let input = "";
for await (const chunk of process.stdin) input += chunk;
let event = {};
try { event = JSON.parse(input || "{}"); } catch { /* ignore malformed input */ }
if (event.stop_hook_active) process.exit(0); // avoid infinite self-triggered corrections

const git = spawnSync("git", ["status", "--porcelain"], { encoding: "utf8" });
if (git.status === 0) {
  const changed = git.stdout.split("\n").filter(Boolean).map((l) => l.slice(3));
  const relevant = changed.filter((f) => /\.(ts|tsx|js|jsx|mjs|prisma|sql|json)$/.test(f) && !f.startsWith("verification/hooks/"));
  if (changed.length === 0 || relevant.length === 0) process.exit(0);
}

let scripts = {};
try { scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts ?? {}; } catch { /* ignore */ }
const script = scripts["fv:fast"] ? "fv:fast" : "fv:check";
const result = spawnSync("npm", ["run", script], {
  encoding: "utf8", timeout: 110_000, maxBuffer: 2 * 1024 * 1024,
  env: { ...process.env, CI: "1" },
});
if (result.status === 3) {
  console.error("fv:check is NOT CONFIGURED (no project verification wired up). Not blocking; configure fv:project.");
  process.exit(0);
}
if (result.status !== 0) {
  console.error("Verification failed. Diagnose and fix; do not weaken valid tests.\n" +
    [result.stdout, result.stderr, result.error?.message].filter(Boolean).join("\n").slice(-12000));
  process.exit(2);
}
console.log(`Verification passed: ${script}`);
