# Next.js + TypeScript Formal Verification Kit

Portable integration for existing **Next.js App Router or Pages Router** projects. No production routes are modified.

## Install

From this repository:

```bash
node integrations/nextjs/install.mjs /absolute/path/to/next-project
```

The installer checks for a Next.js package, refuses conflicting files, copies the portable assets, installs dev dependencies via npm, and adds namespaced scripts without replacing existing ones. **Commit your project before running it.** It does not configure branch protection. The example tests prove only the example pure transfer logic, not your app.

## Run in the target

```bash
npm run fv:check         # typecheck (existing project), eslint if available, and property tests
npm run fv:formal        # symbolic example via python3 + z3-solver (install requirements separately)
npm run fv:e2e           # browser smoke test: requires Playwright Chromium installation
```

Install Z3 once in the target: `python3 -m pip install -r verification/requirements.txt`.
Install browser once: `npx playwright install chromium`.

## Task workflow

1. Use the skill `formal-verification` in Codex or Claude Code.
2. Make a contract under `specs/` (copy `verification/spec.template.json`) with reviewed assumptions, preconditions, postconditions and invariants.
3. Run `node scripts/verify-contract.mjs specs/your-task.json --strict` (JSON schema/presence, not a proof).
4. Write independent property/integration tests and/or a finite state model for the actual domain.
5. Use `npm run fv:check` and `npm run fv:formal`, then collect objective evidence.
6. Push to GitHub; require `formal-verification / verify` status via repository rules for blocking merges.

## Hooks

Claude Code: installer places `.claude/settings.local.json` if absent; **not** a shared `settings.json`. Enable the example in `verification/claude-stop-hook.example.json` manually after reviewing existing settings. Hook runs `npm run fv:check` and returns actionable failures; it guards against recursion on `stop_hook_active`. Codex uses repository instructions/skill; CI, not prompts, is the actual gate.

## Scope of claims

This project provides **verification infrastructure**. It cannot infer complete correct specifications from prose or prove unmodeled code. Z3 example proves a symbolic transfer model, while property tests execute an implementation over generated inputs. Real DB transactions, retries, auth and concurrent transfers require separate integration/model tests.
