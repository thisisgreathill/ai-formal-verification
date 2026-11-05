#!/usr/bin/env bash
set -euo pipefail
if [[ $# -ne 1 ]]; then echo "Usage: bash scripts/install-to-project.sh /path/to/project"; exit 2; fi
SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$1"
if [[ ! -d "$TARGET" || ! -f "$TARGET/package.json" ]]; then echo "Target must be an existing Node project with package.json"; exit 2; fi
copy_if_absent() {
  local src="$1" dest="$2"
  if [[ -e "$TARGET/$dest" ]]; then echo "SKIP exists: $dest"; return; fi
  mkdir -p "$(dirname "$TARGET/$dest")"
  cp "$SOURCE/$src" "$TARGET/$dest"
  echo "ADD: $dest"
}
for f in \
  ".agents/skills/formal-verification/SKILL.md" \
  ".claude/skills/formal-verification/SKILL.md" \
  "AGENTS.md" "CLAUDE.md" \
  "docs/BUG-CLASSES.md" \
  "scripts/verify-contract.mjs" "scripts/mutation-checklist.md" \
  "templates/contract.template.json" "templates/evidence-report.template.md" "templates/model-based.test.template.ts" \
  "specs/example-transfer.json"; do
  copy_if_absent "$f" "$f"
done
echo "Installed. Next: copy templates/contract.template.json to specs/<id>.json, fill it, run: node scripts/verify-contract.mjs specs/<id>.json --strict"
