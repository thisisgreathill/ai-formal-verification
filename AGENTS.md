# Agent Verification Policy

For any significant code change, apply the `formal-verification` skill at `.agents/skills/formal-verification/SKILL.md`.

- Convert the task to explicit inputs, preconditions, postconditions, invariants, and failure behavior before writing code.
- Record assumptions, especially monetary units, concurrent updates, rounding, and permissions.
- Require review of spec assumptions for critical operations.
- Add deterministic tests and property-based tests, plus a model when useful.
- Execute relevant verification commands; report exact output, failed checks and limits.
- Never weaken a test or alter a specification solely to obtain a green result.
- Never describe passing example models as proof of arbitrary production code.
- Spec must come from owner decisions/docs, not from the code under test; mark `derived-from-code` items for review.
- Test against the REAL database and real service code; include concurrency and replay; run a mutation check (tests must be able to fail).
- Use `docs/BUG-CLASSES.md` as the checklist of known bug classes and attack strategies.
- Finish with the evidence report template; list what is NOT proven.
