#!/usr/bin/env bash
# Publish this codebase to GitHub so Vercel can deploy tca.myflynai.com
set -euo pipefail

GITHUB_REPO="${GITHUB_REPO:-roosevelt-jpg/trading-cube-academy}"
BRANCH="${BRANCH:-main}"

echo "→ Target: https://github.com/${GITHUB_REPO} (${BRANCH})"
echo "→ This replaces the old v0 site with the current Trading Cube Academy build."
echo ""

if ! git remote get-url upstream &>/dev/null; then
  git remote add upstream "https://github.com/${GITHUB_REPO}.git"
fi

read -r -p "Force-push ${BRANCH} to GitHub? [y/N] " confirm
if [[ "${confirm,,}" != "y" ]]; then
  echo "Aborted."
  exit 1
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
