import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const scripts = packageJson.scripts ?? {};
const steps = [["npx", ["tsc", "--noEmit"]]];
if (scripts.lint) steps.push(["npm", ["run", "lint"]]);
steps.push(["npx", ["vitest", "run", "--config", "verification/vitest.config.ts"]]);

for (const [command,args] of steps) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.error || result.status !== 0) {
    console.error("FAIL", command, ...args, result.error?.message ?? "");
    process.exit(result.status || 1);
  }
}
console.log("PASS fv:check — this is not a proof of all application behavior");
