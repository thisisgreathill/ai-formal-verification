// Claude Code Stop hook. Runs deterministic checks, returns feedback once.
// Do not auto-enable in existing settings; merge manually to preserve other hooks.
import { spawnSync } from "node:child_process";
let input = "";
for await (const chunk of process.stdin) input += chunk;
let event = {};
try { event = JSON.parse(input || "{}"); } catch { /* ignore malformed input */ }
if (event.stop_hook_active) process.exit(0); // avoid infinite self-triggered corrections
const result = spawnSync("npm", ["run", "fv:check"], {
  encoding: "utf8", timeout: 110_000, maxBuffer: 2 * 1024 * 1024,
  env: { ...process.env, CI: "1" },
});
if (result.status !== 0) {
  console.error("Verification failed. Diagnose and fix; do not weaken valid tests.\n" +
    [result.stdout, result.stderr, result.error?.message].filter(Boolean).join("\n").slice(-12000));
  process.exit(2);
}
console.log("Verification passed: fv:check");
