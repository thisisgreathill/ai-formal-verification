import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

// fv:check = typecheck + lint + (optional) kit sample + YOUR project verification (script `fv:project` or env FV_CMD).
// Exit codes: 0 pass | 1 failure | 3 NOT CONFIGURED (no project verification wired up; never reported as a pass).
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const scripts = packageJson.scripts ?? {};
const run = (command, args, label) => {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.error || result.status !== 0) {
    console.error("FAIL", label ?? [command, ...args].join(" "), result.error?.message ?? "");
    process.exit(result.status || 1);
  }
};

run("npx", ["tsc", "--noEmit"]);
if (scripts.lint) run("npm", ["run", "lint"]);
if (existsSync("verification/vitest.config.ts")) {
  run("npx", ["vitest", "run", "--config", "verification/vitest.config.ts"], "kit sample tests (toy transfer example)");
}

const projectCmd = process.env.FV_CMD || (scripts["fv:project"] ? "npm run fv:project" : "");
if (!projectCmd) {
  console.error(
    "\nNOT CONFIGURED: no project verification is wired up, so NOTHING about your application was verified.\n" +
    "Add a script \"fv:project\" (for example your model-based / money / permission tests, see templates/model-based.test.template.ts)\n" +
    "or set FV_CMD. Optional \"fv:fast\" is used by the Claude Stop hook for a quick subset.\n"
  );
  process.exit(3);
}
const [command, ...args] = projectCmd.split(" ");
run(command, args, `project verification: ${projectCmd}`);
console.log("PASS fv:check - project verification ran. This is evidence, not a proof of all behavior; see the evidence report limits.");
