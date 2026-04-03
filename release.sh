#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# release.sh — bump version, commit, tag, push → GitHub Actions builds & releases
#
# Usage:
#   ./release.sh           # patch: 1.0.0 → 1.0.1
#   ./release.sh minor     # minor: 1.0.0 → 1.1.0
#   ./release.sh major     # major: 1.0.0 → 2.0.0
#   ./release.sh 1.2.3     # exact version
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${CYAN}▸${NC} $*"; }
ok()   { echo -e "${GREEN}✓${NC} $*"; }
die()  { echo -e "${RED}✗${NC} $*" >&2; exit 1; }

# ── Prereqs ───────────────────────────────────────────────────────────────────
command -v git  >/dev/null || die "git not found"
command -v node >/dev/null || die "node not found"

[[ -f "package.json" ]]          || die "Run from project root"
[[ -f "src-tauri/Cargo.toml" ]]  || die "src-tauri/Cargo.toml not found"

# ── Clean working tree ────────────────────────────────────────────────────────
if [[ -n "$(git status --porcelain)" ]]; then
  die "Uncommitted changes exist. Commit or stash first."
fi

# ── Current version (via node — no jq needed) ────────────────────────────────
CURRENT=$(node -p "require('./package.json').version")
log "Current version: ${BOLD}${CURRENT}${NC}"

# ── Next version ──────────────────────────────────────────────────────────────
BUMP="${1:-patch}"
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

case "$BUMP" in
  major)   NEXT="$((MAJOR+1)).0.0" ;;
  minor)   NEXT="${MAJOR}.$((MINOR+1)).0" ;;
  patch)   NEXT="${MAJOR}.${MINOR}.$((PATCH+1))" ;;
  [0-9]*)  NEXT="$BUMP" ;;
  *)       die "Usage: ./release.sh [major|minor|patch|x.y.z]" ;;
esac

echo -e "  ${BOLD}${CURRENT} → ${NEXT}${NC}"
echo ""
read -rp "$(echo -e "${YELLOW}Continue?${NC} [y/N] ")" CONFIRM
[[ "${CONFIRM,,}" == "y" ]] || { log "Aborted."; exit 0; }
echo ""

# ── Bump all three version files (via node — cross-platform) ─────────────────
log "Bumping package.json..."
node -e "
  const fs = require('fs');
  const p = JSON.parse(fs.readFileSync('package.json','utf8'));
  p.version = '${NEXT}';
  fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
"
ok "package.json → ${NEXT}"

log "Bumping src-tauri/tauri.conf.json..."
node -e "
  const fs = require('fs');
  const p = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json','utf8'));
  p.version = '${NEXT}';
  fs.writeFileSync('src-tauri/tauri.conf.json', JSON.stringify(p, null, 2) + '\n');
"
ok "tauri.conf.json → ${NEXT}"

log "Bumping src-tauri/Cargo.toml..."
# sed is fine for Cargo.toml — the version line is always at the top
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "0,/^version = \"${CURRENT}\"/s//version = \"${NEXT}\"/" src-tauri/Cargo.toml
else
  sed -i "0,/^version = \"${CURRENT}\"/s//version = \"${NEXT}\"/" src-tauri/Cargo.toml
fi
ok "Cargo.toml → ${NEXT}"

# ── Git commit + tag + push ───────────────────────────────────────────────────
TAG="v${NEXT}"

log "Committing..."
git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
git commit -m "chore: release ${TAG}"
ok "Committed"

log "Tagging ${TAG}..."
git tag -a "${TAG}" -m "Release ${TAG}"
ok "Tagged"

log "Pushing to origin..."
git push origin main
git push origin "${TAG}"
ok "Pushed"

# ── Done ──────────────────────────────────────────────────────────────────────
REPO=$(git remote get-url origin | sed 's|.*github\.com[:/]\(.*\)\.git|\1|; s|.*github\.com[:/]\(.*\)|\1|')
echo ""
echo -e "${GREEN}${BOLD}🚀 Release ${TAG} is building!${NC}"
echo -e "   Actions : ${CYAN}https://github.com/${REPO}/actions${NC}"
echo -e "   Release : ${CYAN}https://github.com/${REPO}/releases/tag/${TAG}${NC}"
echo ""
echo -e "   Builds take ~15-20 min. Files attached automatically:"
echo -e "   • Teleprompter_${NEXT}_aarch64.dmg  (macOS Apple Silicon)"
echo -e "   • Teleprompter_${NEXT}_x64.dmg       (macOS Intel)"
echo -e "   • Teleprompter_${NEXT}_x64-setup.exe (Windows)"
