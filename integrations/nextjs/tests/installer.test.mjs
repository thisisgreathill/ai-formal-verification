// Lightweight structural check; installer is not executed against a user's project here.
import { readFileSync, existsSync } from "node:fs";
import { strict as assert } from "node:assert";
const required = [
  "integrations/nextjs/install.mjs",
  "integrations/nextjs/verify.mjs",
  "integrations/nextjs/hooks/claude-stop.mjs",
  "integrations/nextjs/workflow.yml",
  ".agents/skills/formal-verification/SKILL.md",
  ".claude/skills/formal-verification/SKILL.md",
];
required.forEach((file) => assert.ok(existsSync(file), `Missing ${file}`));
const hook = readFileSync("integrations/nextjs/hooks/claude-stop.mjs", "utf8");
assert.ok(hook.includes("stop_hook_active"), "Claude hook needs reentry guard");
console.log("PASS reusable kit structure");
