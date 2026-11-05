# AI Formal Verification Kit

A reusable, **private** verification kit for Codex, Claude Code, and TypeScript projects.

**Workflow:** natural language task → reviewed specification → implementation → property tests → optional SMT proof → evidence report.

This repository includes a working example for balance transfers, not a universal correctness proof. The Z3 proof verifies the explicitly written mathematical model; it does **not** prove an arbitrary Next.js application is correct.

## Run the demo

Requirements: Node.js 20+ and Python 3.10+.

```bash
npm install
python3 -m pip install -r requirements.txt
npm run verify
```

`npm run verify` checks the JSON specification, runs property-based tests, and checks the Z3 model. Exit code is nonzero if any stage fails. `npm run verify:js` works without Python.

## Install in a project

Clone this repository, then run:

```bash
bash scripts/install-to-project.sh /absolute/path/to/your-nextjs-project
```

The installer **does not overwrite** existing files. It copies skill definitions, task templates and a lightweight verification command. In the target project install your own tests and add a `verify` package script. Running `node scripts/verify-contract.mjs specs/example-transfer.json` validates the task contract.

## Codex / Claude Code

- Codex skill: `.agents/skills/formal-verification/SKILL.md`
- Claude Code skill: `.claude/skills/formal-verification/SKILL.md`
- Portable policy: `AGENTS.md` and `CLAUDE.md`

Use the skill for high-risk logic. First agree on the assumptions and properties to verify, then implement and test.

## What actually finds money bugs (lessons from a real project)

Model proofs alone found none of the real defects. What did: a **written spec from owner decisions**, a **pure reference model**,
**seeded random event sequences against the real Postgres** compared with the model after every step, **concurrency pairs**,
**adversarial scenarios**, **mutation checks** and an **independent second review**. Catalogue: `docs/BUG-CLASSES.md`.
Templates: `templates/` (contract v2 with traceability, model-based test skeleton, evidence report).
Validate a contract: `node scripts/verify-contract.mjs specs/<id>.json --strict`.

## Verification levels

1. **Executable checks:** TypeScript / lint / unit / integration / browser tests.
2. **Property tests:** fast-check generates input cases and shrinks failures.
3. **Formal model:** Z3 checks logical satisfiability of a narrowly defined model; TLA+ / model checking can later handle concurrency and distributed state transitions.
4. **Production evidence:** transaction boundaries, database constraints, auth checks, idempotency and monitoring must be independently verified in the real system.

## Project layout

- `specs/`: versioned task contracts
- `src/`: example business logic
- `tests/`: property-based tests
- `formal/`: Z3 model and checks
- `scripts/`: specification validation and reusable installer
- `.github/workflows/`: CI

## Safety

Never approve code merely because an AI agent says it is verified. Models can omit cases, and passing generated tests cannot prove the requirements themselves are correct. Review the specification separately from the implementation and enforce required CI checks in GitHub repository settings.
