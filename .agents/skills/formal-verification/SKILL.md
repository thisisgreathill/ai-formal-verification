---
name: formal-verification
description: Contract-first verification of high-risk logic (money, wallets, bonuses, permissions, concurrency, idempotency). Builds a written spec, a pure reference model, model-based random testing against the REAL database incl. concurrency, adversarial strategies, mutation checks and an evidence report. Use for payments, ledgers, bonus/wagering, withdrawals, raffles, admin money actions.
---

# Formal Verification (practical, evidence-based)

Goal: find real bugs in real code, and be honest about what is and is not proven. Follow `AGENTS.md`.
A Z3/TLA+ proof of an abstract model is only ONE tool. Most real money bugs live in transaction
boundaries, locking, idempotency, rounding, state transitions and "who calls whom" — which only a
test against the REAL database and REAL service code can reveal. See `docs/BUG-CLASSES.md`.

## Hard rules
1. The SPEC comes from owner decisions / docs, NOT reverse-engineered from the code under test.
   If you derive a rule from code, mark it `derived-from-code` and ask for review.
2. Never weaken a test, change a spec or widen a tolerance just to get green. A red result is a finding.
3. Never claim "proven" or "verified" beyond the stated scope. Always fill the Evidence Report limits section.
4. Do not fabricate PASS. Quote exact commands and counts (suites, runs, steps, seeds).
5. Money = integer minor units (BigInt), exact rational arithmetic for multipliers, never floats.
6. Real writes/production data are out of bounds: use a disposable database only.

## Workflow (do ALL phases; skipping one must be justified in the report)

### Phase 0 — Scope
List every code path that moves value or changes entitlement (grep services, routes, server actions,
webhooks, cron/outbox consumers, admin actions). Output a table: path, actor, trigger, tables written.

### Phase 1 — Contract (`specs/<id>.json` + `docs/<ID>-SPEC.md`)
Use `templates/contract.template.json`. For every operation: inputs, preconditions, postconditions,
failure behaviour, and numbered INVARIANTS (I1..In) written as checkable statements. Each invariant must list
`checks`: the test files/names that enforce it (traceability). List ambiguities and contradictions
between docs and code as `issues[]` and resolve them with the owner or choose the safest operator behaviour
and record it under `decisions[]`. `node scripts/verify-contract.mjs <spec>` must pass (it checks traceability too).

### Phase 2 — Reference model
A pure in-memory implementation (no DB, no I/O, BigInt arithmetic) of the state machine. It must be small enough
to read in one sitting and independently derived from the spec.

### Phase 3 — Model-based testing against the REAL system
- Disposable real database (same engine and schema as production). Seeded, deterministic generator
  (or fast-check commands) producing random event sequences incl. replays, out-of-order and invalid events.
- After EVERY step compare model vs real state (all balances, counters, statuses, ledger rows) and assert all global invariants
  (non-negativity, conservation vs ledger, caps, monotone counters, idempotent replays, closed states stay closed).
- Concurrency: run pairs/groups of operations with `Promise.all` on the same user/row (double spend, double claim,
  refund vs settle, cancel vs draw) and assert exactly-once semantics. Use a small DB pool too (pool starvation is a real bug class).
- Report: seeds, runs, steps per run, number of operations by type (a never-exercised operation = untested).

### Phase 4 — Adversarial strategies
Walk the catalogue in `docs/BUG-CLASSES.md` §Attack strategies and implement the relevant ones as scripted scenarios:
hedging, min-odds spam, deposit-bet-cancel loops, claim-while-active, pool transfers, boundary values (0, 1, max safe, MAX BigInt),
tiny stakes with rounding, late events after closure, duplicate/replayed callbacks, refund after settle, partial refunds.

### Phase 5 — Mutation check (tests must be able to FAIL)
For each critical rule, inject a deliberate bug in a scratch copy (drop a lock, remove an idempotency check, use `>=` for `>`,
skip a cap, double-credit) and confirm the suite goes RED. A rule whose mutation survives is untested: add a test.
Record `mutations killed / total` in the report. Use the helper in `scripts/mutation-checklist.md`.

### Phase 6 — Independent second look
After fixes, re-read the changed code adversarially as a different reviewer: for each fix ask "what new state/path does this create?".
Prefer a second independent agent/session on the same scope; diff findings.

### Phase 7 — Evidence report (`docs/<ID>-VERIFICATION.md`, `templates/evidence-report.template.md`)
Scope, spec version, commands run, counts, findings (severity, class, failing test first, fix), decisions, residual risks,
what is NOT covered (e.g. external engine behaviour, provider callbacks content, production config), how to re-run.

## Finding format
`F<n> | severity | bug class (docs/BUG-CLASSES.md) | where (file:line) | failing test | fix | owner decision needed?`

## Output contract
At the end state plainly: scope covered, invariants enforced (with test names), mutations killed, findings fixed,
findings left (with reason), and explicit "not proven" list. Never say the system "is correct".
