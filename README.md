# APPTEST — Reusable business-app proposals by MABRIG Technologies

**Repository:** https://github.com/mabrig1/APPTEST
**Purpose:** Show prospective business clients a working proposal website, refine it with feedback, launch the approved site on its **own domain**, and replace the APPTEST demo with the next client.

This is an interactive proposal platform, NOT a multi-tenant e-commerce production system or a password-protected client portal.

## First demonstration

The initial showcase is **BOSAL STORES**, a supermarket and eatery owned by **AGBO SALVATION, O.**, No. 12 Hill Top, opposite Trinity Lodge, Nsukka, Enugu State, Nigeria. Public contact supplied: **09063866923**. Catalogue items are illustrative and prices/availability are not verified.

- Home (#home): marketing, current concept and calls to action.
- Demo (#demo): branded responsive page, search, category filters, local demo basket and WhatsApp sample enquiry draft.
- Studio (#studio): local proposal composer, instant visual preview, JSON import/export, colors and service listings.
- Handover (#handover): client approval, private archive and replace-client process.

The public site reads its active business from **active-client.json**. You do NOT need to rebuild the platform to switch client brands.

## Run and validate

Zero-dependency static app. Run from the repository root:

    python -m http.server 8000

Visit http://localhost:8000. Opening index.html directly uses the built-in fallback config when browser security blocks a file:// JSON fetch.

Validate:

    node --check app.js
    node --test tests/check.mjs

## Sales, production, and client replacement cycle

1. **Brief.** Collect approved public business name, category, contact/location, colors, services, assets and core customer journeys.
2. **Concept.** Use the APPTEST Proposal Studio to build a local draft. This editor is intentionally local-only; it does not write to a website, GitHub or a database.
3. **Export.** Choose Export JSON. Keep the candidate and previous approved version safely outside this public repo.
4. **Publish a proposal.** Create a reviewed Git branch that replaces active-client.json with the approved JSON. Open a PR, check the staging preview, approve and deploy to the APPTEST subdomain.
5. **Get feedback.** Share the demo link, confirm business copy, phone number, examples and image rights; record client approval separately.
6. **Graduate.** Build the production system in a separate repository, with its own domain and proper secure accounts, real database, actual prices, backups and payment flows only if contracted.
7. **Handover.** Confirm SSL, tested workflows, client rights, final URL, maintenance, rollback and written acceptance.
8. **Archive privately.** Keep proposal/design/approval materials outside public Git. Do not archive real order records or confidential customer documents here.
9. **Replace.** Update only active-client.json for the next public-approved concept via a review PR. Verify the demo and invalidate CDN caches if needed. The APPTEST domain itself stays in place.

**Important:** deleting or replacing a client from the current site does NOT remove older business details from public Git history, caches or copies. Never put confidential client information in this repository.

## Hosting

Works on Cloudflare Pages, Vercel or GitHub Pages:
- Framework preset: None/Other.
- Build command: none.
- Publish directory: repository root (.) for Cloudflare Pages, or equivalent static directory in other hosts.
- Suggested future demo address: apptest.mabrigkorie.org, subject to DNS ownership and deployment approval. This URL is not claimed to exist yet.
- Separate production client projects and domains; do not publish APPTEST as a payment-enabled real store.

## Current constraints

- No authenticated studio or admin accounts, centralized order/inventory storage, automated approval, secure client share links or actual payments.
- Demo basket lives in browser memory only.
- WhatsApp action opens a draft clearly labelled APPTEST DEMO / NOT A REAL ORDER; the customer must choose whether to send.
- Products and prices are mock concepts, never confirmed availability.
- Anyone visiting Studio can draft a concept on their own device; this does not change the shared live site.
- This repo is public. No passwords, API keys, private client proposals or customer records.

## Next phases

Secure private studio with per-client previews and expirations; client proposal approval and feedback records; protected deployment automation; quotations, milestones and owner handover templates.

Powered by MABRIG Technologies — https://www.mabrigkorie.org
