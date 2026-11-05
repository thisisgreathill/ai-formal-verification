# Claude Code Verification Policy

For high-risk tasks, invoke the formal-verification skill at `.claude/skills/formal-verification/SKILL.md`. Use its contract-first workflow. Report evidence and unverified assumptions. Run project tests and the relevant formal model before marking a task complete. Do not hide failing tests or assert proof about unmodeled behavior.

Also follow AGENTS.md: real-DB model-based tests, concurrency, mutation check, `docs/BUG-CLASSES.md`, evidence report.
