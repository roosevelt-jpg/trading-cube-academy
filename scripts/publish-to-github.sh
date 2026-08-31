#!/usr/bin/env bash
# Publish this codebase to GitHub so Vercel can deploy tca.myflynai.com
set -euo pipefail

GITHUB_REPO="${GITHUB_REPO:-roosevelt-jpg/trading-cube-academy}"
GITHUB_URL="${GITHUB_URL:-https://github.com/${GITHUB_REPO}.git}"
BRANCH="${BRANCH:-main}"

echo "→ Target: ${GITHUB_URL} (${BRANCH})"
echo "→ This replaces the old v0 site with the current Trading Cube Academy build."
echo ""

if ! git remote get-url upstream &>/dev/null; then
  git remote add upstream "${GITHUB_URL}"
else
  git remote set-url upstream "${GITHUB_URL}"
fi

if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  git remote set-url upstream "https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"
fi

if [[ "${FORCE_PUSH:-}" != "1" ]]; then
  read -r -p "Force-push ${BRANCH} to GitHub? [y/N] " confirm
  if [[ "${confirm,,}" != "y" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

git push upstream "${BRANCH}" --force-with-lease

echo ""
echo "✓ Pushed. If Vercel is connected to ${GITHUB_REPO}, a production deploy will start automatically."
echo "  Dashboard: https://vercel.com/dashboard"
echo "  Live site: https://tca.myflynai.com"
echo ""
echo "After deploy, confirm Vercel env vars:"
echo "  NEXT_PUBLIC_SUPABASE_URL"
echo "  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
echo "  SUPABASE_SECRET_KEY"
echo "  BLOB_READ_WRITE_TOKEN"
echo "  NEXT_PUBLIC_SITE_URL=https://tca.myflynai.com"
