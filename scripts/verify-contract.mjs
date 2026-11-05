#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const path = resolve(process.argv[2] ?? "specs/example-transfer.json");
const spec = JSON.parse(readFileSync(path, "utf8"));
const fields = ["id","description","inputs","preconditions","postconditions","invariants","failureBehavior","assumptions","verification","outOfScope"];
const missing = fields.filter((key) => !(key in spec) || spec[key] === null || (Array.isArray(spec[key]) && spec[key].length === 0));
const listFields = ["preconditions","postconditions","invariants","assumptions","verification","outOfScope"];
const malformed = listFields.filter((key) => !Array.isArray(spec[key]) || !spec[key].every((x) => typeof x === "string" && x.trim()));
if (missing.length || malformed.length || !spec.id || !spec.description || !spec.failureBehavior || typeof spec.inputs !== "object" || Array.isArray(spec.inputs)) {
  console.error("FAIL specification validation", { missing, malformed });
  process.exit(1);
}
console.log(`PASS schema presence: ${spec.id}; ${spec.invariants.length} invariants (NOT logical verification)`);
