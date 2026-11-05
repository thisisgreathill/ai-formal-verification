# Next.js + TypeScript Formal Verification Kit

Portable integration for existing **Next.js App Router or Pages Router** projects. No production routes are modified.

## Install

From this repository:

```bash
node integrations/nextjs/install.mjs /absolute/path/to/next-project [--with-z3] [--with-e2e] [--skip-install]
```

The installer checks for a Next.js + TypeScript project, **refuses conflicting files before touching anything**, copies the skill, the policy files and the parts that actually find real bugs (`docs/BUG-CLASSES.md`, `scripts/mutation-checklist.md`, `templates/` with the v2 contract, model-based test skeleton and evidence report), and adds namespaced scripts without replacing existing ones. **Commit your project before running it.**

- **Jest projects keep jest:** vitest and the toy transfer example are not installed (only `fast-check`).
- **Z3 (python) and Playwright are opt-in** (`--with-z3`, `--with-e2e`); the CI workflow only contains the steps you enabled.
- It does not configure branch protection.

## Run in the target

```bash
npm run fv:check         # typecheck, lint, then YOUR project verification (script "fv:project" or env FV_CMD)
npm run fv:formal        # only with --with-z3
npm run fv:e2e           # only with --with-e2e
```

**`fv:check` is not a pass until you wire up project verification.** Without a `fv:project` script it exits with code 3 ("NOT CONFIGURED: nothing about your application was verified"), in CI too. Point `fv:project` at your real-database, model-based, concurrency, money and permission tests (start from `templates/model-based.test.template.ts`). Optional `fv:fast` is a quick subset used by the Claude Stop hook.

## Task workflow

1. Use the skill `formal-verification` in Codex or Claude Code.
2. Make a contract under `specs/` (copy `verification/spec.template.json`, the v2 contract with traceable invariants) with reviewed assumptions, preconditions, postconditions and invariants.
3. Run `node scripts/verify-contract.mjs specs/your-task.json --strict` (JSON schema/presence, not a proof).
4. Write independent property/integration tests and/or a finite state model for the actual domain.
5. Run `npm run fv:check` (your `fv:project` tests), add a mutation check (`scripts/mutation-checklist.md`), then collect evidence with `templates/evidence-report.template.md`.
6. Push to GitHub; require `formal-verification / verify` status via repository rules for blocking merges.

## Hooks

Claude Code: installer places `.claude/settings.local.json` if absent; **not** a shared `settings.json`. Enable the example in `verification/claude-stop-hook.example.json` manually after reviewing existing settings. The hook skips when no source file changed, runs `fv:fast` (else `fv:check`), treats exit 3 (NOT CONFIGURED) as a warning instead of blocking, and returns actionable failures; it guards against recursion on `stop_hook_active`. Codex uses repository instructions/skill; CI, not prompts, is the actual gate.

## Scope of claims

This project provides **verification infrastructure**. It cannot infer complete correct specifications from prose or prove unmodeled code. Z3 example proves a symbolic transfer model, while property tests execute an implementation over generated inputs. Real DB transactions, retries, auth and concurrent transfers require separate integration/model tests.
