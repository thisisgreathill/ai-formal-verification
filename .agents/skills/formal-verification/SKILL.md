---
name: formal-verification
description: Contract-first software development with invariants, fast-check property tests, model checking and precise verification evidence. Use for money, data integrity, auth, concurrency, state transitions, or critical APIs.
---

# Formal Verification

## Workflow
1. Inspect the repository, actual code, DB schema and tests.
2. Convert the task into a contract in `specs/`: inputs, preconditions, postconditions, invariants, known failure modes and assumptions.
3. Ask for human review when a requirement is ambiguous or financially/security critical. Never invent business requirements.
4. Implement one minimal behavior change and add independent tests, preferably before implementation.
5. For pure arithmetic and state properties, use fast-check; for constrained mathematical models use Z3; for concurrency consider TLA+ or Apalache.
6. Run relevant verification commands. Capture failing seeds/counterexamples and fix code, not the goalposts.
7. Report **SPEC / IMPLEMENTATION / TEST EVIDENCE / FORMAL MODEL SCOPE / RESIDUAL RISKS**.

## Verification matrix
- Types, schemas: TypeScript strict and runtime validation.
- Pure logic: deterministic unit tests + fast-check invariants.
- Database effects: real DB integration tests and constraints.
- External APIs: contract tests, retries and idempotency.
- Parallel operations: transaction/locking tests plus model checking as needed.
- UI: Playwright/accessibility/performance budgets (not a mathematical proof of design quality).
- Formal proof: only claims about the explicit assumptions and state model actually checked.

## Never
- Claim universal correctness based only on finite tests.
- Treat an AI-written specification as independently verified.
- Weaken requirements, skip failing commands, or run unsafe scripts without inspection.
