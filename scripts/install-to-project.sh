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
copy_if_absent ".agents/skills/formal-verification/SKILL.md" ".agents/skills/formal-verification/SKILL.md"
copy_if_absent ".claude/skills/formal-verification/SKILL.md" ".claude/skills/formal-verification/SKILL.md"
copy_if_absent "AGENTS.md" "AGENTS.md"
copy_if_absent "CLAUDE.md" "CLAUDE.md"
copy_if_absent "specs/example-transfer.json" "specs/example-transfer.json"
copy_if_absent "scripts/verify-contract.mjs" "scripts/verify-contract.mjs"
echo "Installed templates safely. Review and adapt the specification, then integrate tests into your project scripts."
