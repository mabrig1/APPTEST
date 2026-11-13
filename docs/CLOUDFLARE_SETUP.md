# Deploy APPTEST on Cloudflare Pages Free

Status: **prepared in a GitHub review branch; not yet deployed or connected to a Cloudflare account**. No real keys, paid providers, DNS records or production settings were changed.

## A. Create Cloudflare Pages project

1. Sign in at https://dash.cloudflare.com/ and select Workers & Pages → Create → Pages → Connect to Git.
2. Select GitHub repository **mabrig1/APPTEST**.
3. Use the verified repository's main branch for production **after PR approval**. Preview the feature branch first if your account supports preview builds.
4. Framework preset **None / Other**, root directory **/**, build command **blank**, build output directory **public**.
5. Repository includes a Wrangler configuration: name = "apptest"; pages_build_output_dir = "./public"; compatibility_date = "2026-11-13". If your account has an existing project of that name, adjust the name and verify no existing production configuration will be overwritten.
6. Cloudflare Pages automatically discovers the root-level **functions/** folder for Git-connected builds. Do not use dashboard drag-and-drop uploads for this project: Pages Functions require a compatible deployment process.
7. Verify Cloudflare's generated pages.dev preview. A custom domain is optional and should only be added with explicit DNS approval.

The **only public files** are in the public directory. Never change the output directory to repository root, or you risk publishing server code and documents.

## B. Environment variables and secrets

Go to Cloudflare Pages project → Settings → Variables and Secrets → Add. Add variables to **Preview** first. Set secrets with the **Encrypt** option. Redeploy after adding or modifying bindings. Do not put real key values in GitHub, client-side JavaScript or this README.

| Variable | Type | Use |
| --- | --- | --- |
| OPENROUTER_API_KEY | Encrypted secret | Existing OpenRouter API key |
| APPTEST_ADMIN_TOKEN | Encrypted secret | 24+ character random owner-only authorization token |
| AI_ENABLED | Plain variable | Set to true only after both above secrets are configured |
| RESEND_API_KEY | Encrypted secret | Existing Resend API key |
| RESEND_FROM_EMAIL | Plain variable | Sender email on a Resend-verified domain |
| RESEND_TO_EMAIL | Plain variable | Your real proposal inbox address |
| TURNSTILE_SITE_KEY | Plain variable | Turnstile's public site key |
| TURNSTILE_SECRET | Encrypted secret | Turnstile server-side verification key |
| EMAIL_ENABLED | Plain variable | Set to true only after email and verification are configured |

When unavailable, APIs are **fail-closed**:
- /api/status returns whether AI and email are ready, but never returns secrets.
- /api/proposal requires the private owner token. It uses the free-only model ID openrouter/free and caps input/output size. No premium model can be selected by the browser.
- /api/lead is unavailable until the Resend sender/recipient and both Turnstile values are configured. Submissions require explicit consent and server-side verification of a one-use token and exact request hostname; recipient is controlled by server env, not user input.

Generate a random owner token locally and copy it **directly to Cloudflare's encrypted secret field**:

    node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"

Save it in a password manager. Do not send it to clients or put it in the proposal JSON. The Studio never saves the owner token to browser storage.

## C. Configure OpenRouter for no-paid-model operation

1. Create or use your existing key at https://openrouter.ai/settings/keys.
2. Add OPENROUTER_API_KEY as an encrypted Cloudflare secret.
3. Add APPTEST_ADMIN_TOKEN as an encrypted secret.
4. Set AI_ENABLED=true.
5. Open APPTEST → Proposal Studio. Type a detailed business brief and your owner token, then select Generate AI proposal draft.
6. Review provider activity and quota at OpenRouter. Free models have strict rate limits. The backend only sends model="openrouter/free" and never silently falls back to paid models.

## D. Configure Resend and Cloudflare Turnstile

1. At https://resend.com/domains add a domain you control, and complete verification DNS records. Do not assume mabrigkorie.org is already verified.
2. Create/reuse your Resend API key and save as the encrypted RESEND_API_KEY secret.
3. Set RESEND_FROM_EMAIL to an email belonging to that verified domain. Set RESEND_TO_EMAIL to your intended private inbox.
4. At https://dash.cloudflare.com/ create a Turnstile widget for your exact Pages preview hostname and, if needed, the eventual custom domain. Add its public site key and encrypted secret.
5. Set EMAIL_ENABLED=true in Preview. Submit a single genuine test form enquiry and confirm delivery.
6. Resend Free currently provides 3,000 emails/month and 100 emails/day. Turnstile reduces bot abuse but is not an exhaustive rate limiter: use provider monitoring and, for wider launch, an appropriate Cloudflare WAF/rate-limiting rule.
7. Do not publish real private customer information in APPTEST or retain it in Git. The submission is forwarded to your email provider; review your applicable privacy and retention obligations.

## E. Commands and verification

For local preview (Node.js 20+):

    node --check public/app.js
    node --test tests/*.mjs
    npx wrangler pages dev public

Local secret values, when needed, may be loaded from a .dev.vars file (gitignored), never committed. Use Cloudflare Turnstile testing keys for isolated tests rather than real production credentials.

Before any production release:
- Check all four pages, mobile layout, business identity and demo basket.
- Verify the owner-only free AI endpoint requires the correct token, and cannot select paid models.
- Verify the enquiry endpoint rejects invalid origin, missing consent and invalid Turnstile token.
- Confirm all secrets are encrypted in Cloudflare and never appear in /api/status, public assets, GitHub history or logs.
- Verify preview URL, SSL and Resend DNS sender identity.
- Use a human-reviewed PR and a deliberate deployment approval.
- Monitor OpenRouter free usage, Resend daily limits and Cloudflare Workers requests.

## F. Domain, replacement and rollback

Suggested custom domain after approval: **apptest.mabrigkorie.org**. This is a proposal, not a live or verified URL. Cloudflare's free pages.dev hostname works without custom DNS.

APPTEST keeps one active demonstration in public/active-client.json. After a client's production app launches on its own domain, archive its public-approved concept and handover privately; then change the JSON for the next approved client in a new reviewed PR. Old public commit history, cached files and screenshots may remain recoverable.

To roll back: select the last healthy deployment in Cloudflare Pages and confirm the demo and both API endpoints. To disable an integration, set AI_ENABLED=false or EMAIL_ENABLED=false and redeploy. Revoke provider keys if exposed.

## Documentation

- Cloudflare Pages Functions: https://developers.cloudflare.com/pages/functions/get-started/
- Pages runtime secrets: https://developers.cloudflare.com/pages/functions/bindings/
- Pages Wrangler settings: https://developers.cloudflare.com/pages/functions/wrangler-configuration/
- Turnstile Siteverify: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- OpenRouter free variants: https://openrouter.ai/collections/free-models/
- Resend free-tier quotas: https://resend.com/pricing
