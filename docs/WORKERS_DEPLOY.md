# APPTEST Cloudflare Worker deployment

This repository is connected to a Cloudflare **Worker** named apptest, with deploy command npx wrangler deploy. Its previous build failed because no static assets directory was detected and the actual APPTEST application was not on main.

## Fix

- The root wrangler.toml now specifies main ./worker/index.js and assets directory ./public.
- worker/index.js routes four endpoints to the shared server-only API functions, and serves public web files through an ASSETS binding.
- Keep the existing Cloudflare deploy command: npx wrangler deploy. No R2 bucket is required.
- CI validates browser code and Worker modules, then performs a Wrangler dry-run before promoting to main.

## Secret safety

No real API keys are in the codebase. Configure APPTEST_ADMIN_TOKEN, OPENROUTER_API_KEY, RESEND_API_KEY, TURNSTILE_SECRET as Cloudflare encrypted Worker secrets only. Set AI_ENABLED and EMAIL_ENABLED to true only after credentials and the Resend/Turnstile sender/verification settings are ready. OpenRouter generation is free-model-only. The public variable APPTEST_PUBLIC_URL is https://apptest.mabrigkorie.org.

## Verification

1. Run node --test tests/*.mjs and npx wrangler deploy --dry-run.
2. After the GitHub main merge triggers the connected Worker deployment, check the Cloudflare Deployments tab for a successful build.
3. Open https://apptest.mabrigkorie.org, verify the APPTEST marketing site and BOSAL STORES example, and open /api/status to verify a JSON response.
4. Verify that server-only paths under /functions/ and /worker/ are inaccessible.
5. Confirm the domain is attached under Cloudflare Worker Settings > Domains & Routes. Domain/DNS attachment remains an account action if not already complete.

## Rollback

If the release fails, use Cloudflare Deployments > Rollback to the prior healthy version or revert the GitHub merge. Do not force-push. Any old public placeholder stays visible until the new Worker version actually deploys successfully.
