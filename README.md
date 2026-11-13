# APPTEST — Business App Proposal Platform

By **MABRIG Technologies**: https://www.mabrigkorie.org

APPTEST displays one active client prototype at a time. Show the client a mobile-friendly clickable business concept, receive feedback, develop their approved real application on its **own domain**, then privately archive and replace the active prototype.

**First showcase:** BOSAL STORES (No 12 Hill Top, opposite Trinity Lodge, Nsukka, Nigeria; owner AGBO SALVATION, O.). Products are illustrative; no stock, actual prices or payments are connected.

## Working features

- Public marketing page, interactive client storefront, proposal studio and handover guidance.
- Search, category filters, demo-only basket, WhatsApp enquiry drafts.
- Local business proposal designer with four starter business templates, instant previews and JSON export/import.
- Cloudflare Worker static-assets layout: public assets under **public/**, Worker API router under **worker/**, reusable private handlers under **functions/**.
- Optional owner-protected OpenRouter AI draft endpoint, hardcoded to **openrouter/free**.
- Optional Resend email enquiry endpoint with Cloudflare Turnstile server verification and consent.
- Fail-closed integrations: demo remains available without secrets; email/AI disabled until ready.

## Run locally

Requires Node.js 20+, no runtime dependencies.

    node --check public/app.js
    node --test tests/*.mjs
    npx wrangler pages dev public

Static files are inside **public/**. Do not expose repository root as the publishing directory.

## Cloudflare setup

Follow **docs/CLOUDFLARE_SETUP.md** before using API keys or connecting GitHub. This change only prepares deployment; it does not create a project, change DNS, configure actual secret values, incur a provider charge, merge or deploy.

## Business security boundaries

The public proposal studio is **local to your browser only**, not a private admin service or shared order database. Owner-only AI access requires a secure token, but studio edits cannot publish automatically. No payments or orders are processed. Never commit sensitive data, private briefs, API keys or customer records. Public Git history persists even after replacing the demonstration client.


### Current deployment target / API onboarding

The intended domain is **https://apptest.mabrigkorie.org** (requires Cloudflare Pages custom-domain attachment). A safe, commit-ready non-secret environment template is at **config/env.example**. Owner-only API connectivity testing will be available in the Proposal Studio after you set APPTEST_ADMIN_TOKEN securely in Cloudflare; OpenRouter/Resend are disabled until their real credentials and verification settings are added.

Quick API setup and copy-ready test commands are in docs/CLOUDFLARE_SETUP.md under **Copy-ready non-secret settings** and **Test the API**.

**Production deployment fix:** See [docs/WORKERS_DEPLOY.md](docs/WORKERS_DEPLOY.md). The connected app is a Cloudflare Worker using `npx wrangler deploy` (not a Pages project). The PR includes the real Worker entrypoint, assets directory, and a bundling dry-run in CI.

## BOSAL STORE storefront demonstration (November 13, 2026)

- **BOSAL STORE** is the initial landing page at the root domain, not the APPTEST marketing overview.
- **BOSAL RESTAURANT** is a separate shopping department with Nigerian rice meals, soups and swallow, grills, snacks and drinks.
- **211 illustrative entries**: 176 supermarket goods, 35 restaurant menu items, 24 categories; sample pack sizes, descriptions, naira prices and labels.
- Category filters, text search, price/name sorting, show-more pagination, mixed store-and-restaurant basket, demonstration WhatsApp enquiry, responsive product cards.
- APPTEST and MABRIG Technologies remain available as the underlying proposal service, editor, and footer credit. The first page sells the client's brand.

**Honesty and safety:** These are **demo prices and proposed stock**, not verified BOSAL inventory or live orders. The shop is for client review before owner approval. Product images are illustrative icons until approved packshots are provided; WhatsApp produces a sample enquiry, not an order confirmation. No real payment or account collection exists.
