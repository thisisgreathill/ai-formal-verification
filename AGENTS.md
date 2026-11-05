# Agent Verification Policy

For any significant code change, apply the `formal-verification` skill at `.agents/skills/formal-verification/SKILL.md`.

- Convert the task to explicit inputs, preconditions, postconditions, invariants, and failure behavior before writing code.
- Record assumptions, especially monetary units, concurrent updates, rounding, and permissions.
- Require review of spec assumptions for critical operations.
- Add deterministic tests and property-based tests, plus a model when useful.
- Execute relevant verification commands; report exact output, failed checks and limits.
- Never weaken a test or alter a specification solely to obtain a green result.
- Never describe passing example models as proof of arbitrary production code.
