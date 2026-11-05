---
name: formal-verification
description: Convert coding tasks into checkable contracts and verify them with tests and formal models. Use for critical logic, payments, permissions, concurrency, and data integrity.
---

# Formal Verification

Follow the same repository-wide contract-first policy in `AGENTS.md`.

1. Inspect code, requirements, and data models.
2. Create or update a task contract in `specs/`.
3. Identify preconditions, postconditions, invariants, counterexamples and assumptions.
4. Implement tests before or alongside code; use fast-check for general properties and Z3/TLA+ for scoped formal models.
5. Run all relevant checks (in this example: `npm run verify`).
6. When a test fails, show the minimal counterexample, fix the behavior and rerun.
7. Produce evidence, state limitations and unverified requirements explicitly.

Do not fabricate PASS or call a passing abstract model proof of actual program correctness.
