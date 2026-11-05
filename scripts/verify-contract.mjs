#!/usr/bin/env node
// Validates a verification contract. v1 (string invariants) and v2 (object invariants with
// traceability `checks`) are supported. v2 also checks that every referenced test exists.
// This checks STRUCTURE and TRACEABILITY only; it is NOT logical verification of the code.
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const path = resolve(args.find((a) => !a.startsWith("--")) ?? "specs/example-transfer.json");
const spec = JSON.parse(readFileSync(path, "utf8"));
const root = process.env.PROJECT_ROOT ? resolve(process.env.PROJECT_ROOT) : process.cwd();
const errors = [];

const need = (key) => {
  if (!(key in spec) || spec[key] === null || spec[key] === "" || (Array.isArray(spec[key]) && spec[key].length === 0)) errors.push(`missing or empty: ${key}`);
};
["id", "description", "assumptions", "verification", "outOfScope", "invariants"].forEach(need);

const isV2 = Array.isArray(spec.invariants) && spec.invariants.some((i) => typeof i === "object");
if (isV2) {
  need("operations");
  const ids = new Set();
  for (const inv of spec.invariants ?? []) {
    if (typeof inv !== "object" || !inv.id || !inv.statement) { errors.push(`invariant must be {id,statement,checks}: ${JSON.stringify(inv)}`); continue; }
    if (ids.has(inv.id)) errors.push(`duplicate invariant id ${inv.id}`);
    ids.add(inv.id);
    if (!Array.isArray(inv.checks) || inv.checks.length === 0) { errors.push(`${inv.id}: no enforcing test listed (untraced invariant)`); continue; }
    for (const ref of inv.checks) {
      const [file, name] = String(ref).split("::");
      const full = resolve(root, file);
      if (!existsSync(full)) { errors.push(`${inv.id}: test file not found: ${file}`); continue; }
      if (name && !readFileSync(full, "utf8").includes(name)) errors.push(`${inv.id}: test name not found in ${file}: "${name}"`);
    }
  }
  for (const op of spec.operations ?? []) {
    for (const k of ["name", "preconditions", "postconditions", "failureBehavior"]) if (!op[k] || (Array.isArray(op[k]) && !op[k].length)) errors.push(`operation ${op.name ?? "?"}: missing ${k}`);
  }
  for (const d of spec.decisions ?? []) if (!d.source) errors.push(`decision ${d.id}: source required (owner | safest-default | derived-from-code)`);
  const derived = (spec.decisions ?? []).filter((d) => d.source === "derived-from-code");
  if (derived.length) console.warn(`WARN ${derived.length} decision(s) derived from code need owner review: ${derived.map((d) => d.id).join(", ")}`);
} else {
  if (strict) errors.push("--strict requires v2 contract (object invariants with checks)");
  ["preconditions", "postconditions", "failureBehavior", "inputs"].forEach(need);
}

if (errors.length) {
  console.error("FAIL specification validation\n - " + errors.join("\n - "));
  process.exit(1);
}
console.log(`PASS ${isV2 ? "v2 contract + traceability" : "v1 schema presence"}: ${spec.id}; ${spec.invariants.length} invariants (structure only, NOT logical verification)`);
