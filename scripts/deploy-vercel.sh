#!/usr/bin/env bash
# Deploy directly to Vercel (bypasses GitHub). Requires a Vercel access token.
set -euo pipefail

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "VERCEL_TOKEN is required."
  echo ""
  echo "1. Create a token: https://vercel.com/account/tokens"
  echo "2. In Vercel → Project → Settings → General, copy Project ID and Team ID"
  echo "3. Run:"
  echo "   export VERCEL_TOKEN=vcp_..."
  echo "   export VERCEL_ORG_ID=team_..."
  echo "   export VERCEL_PROJECT_ID=prj_..."
  echo "   ./scripts/deploy-vercel.sh"
  echo ""
  echo "Or add those three vars to your Cloud Agent environment secrets and ask the agent to deploy."
  exit 1
fi

export VERCEL_TOKEN

if [[ -n "${VERCEL_ORG_ID:-}" && -n "${VERCEL_PROJECT_ID:-}" ]]; then
  export VERCEL_ORG_ID VERCEL_PROJECT_ID
elif [[ ! -f .vercel/project.json ]]; then
  echo "Link the project once (needs VERCEL_ORG_ID + VERCEL_PROJECT_ID), or run: vercel link --yes"
  exit 1
fi

# Avoid pnpm/npm lock conflicts on Vercel CLI local build
if [[ -f pnpm-lock.yaml ]]; then
  echo "Removing pnpm-lock.yaml (project uses npm)."
  rm -f pnpm-lock.yaml
fi

if [[ ! -f package-lock.json ]]; then
  npm install --package-lock-only
fi

echo "→ Deploying to Vercel production (tca.myflynai.com if domain is configured)…"
npx vercel deploy --prod --yes --no-wait

echo ""
echo "✓ Production deploy started. Check https://vercel.com/dashboard"
