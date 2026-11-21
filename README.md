# DynamicShopper

DynamicShopper is a Thai and English shopping prototype built with SvelteKit. A shopper can ask for a comparison table, read a listing in large type, or open a receipt showing how vouchers and coins change the payable total. The assistant can change the presentation. The simulated catalog supplies the facts, and one pricing engine calculates every deal.

## Running the storefront

Install Git, Node.js and Bun. From the repository root, start the keyless demo with these commands, then open the local URL printed by Vite. The shopping routes work without a database or an AI account.

```sh
bun install --frozen-lockfile
bun run dev
```

### Try the demo

The [39-second silent demo](docs/demo/DynamicShopper-final-demo.mp4) follows one rice cooker from its photo to the cart and itemized receipt, then shows a live request to change the shop’s appearance and Undo.

To follow the cart journey, open a product and choose **Add to cart**. **View cart** shows the item, quantity and unit price. Choose **Best price for my cart** to see shipping, vouchers, coins and the final quote. You can reopen **Cart** from the storefront.

1. Open `/` and choose **Rice cookers**. Select **1.8 L**. Choose **ไทย** to try the same journey in Thai.
2. Select **Start a quick interview** (**เริ่มตอบคำถามสั้น ๆ**). Answer **Compare** and **Specs**, skip the remaining questions, and review the proposed changes. **Apply my view** opens the filtered comparison table. Closing the draft leaves the shelf as it was.
3. Open a product, inspect a catalog specification, then choose **Back to store**. The applied interview and capacity selection return. Choose **Refine this view in chat** to ask a question. **Undo** returns to the preceding store state.
4. On the default storefront, **Compare products** opens a picker for two catalog products and the facts to show. **Calculate a deal** opens the optimizer for a selected item. These actions keep the shelf order.
5. For direct controls, open `/?view=receipt` or choose **Shopping assistant** from the default storefront. Open **Shopping criteria** to edit a requirement such as the maximum budget, a preference, or the view independently. Try **Shopper views**, **Compare views**, and **Best price**. The comparison keeps the eligible shelf. Best price shows the optimizer's itemized calculation in whole baht.

| Route | What to try |
| --- | --- |
| `/` | Search, switch language, apply filters, or review the optional interview. |
| `/?view=receipt` | Explore the adaptive shelf, chat, cart, shareable look, and X-ray. |
| `/compare` | Compare two presentation presets against the same eligible catalog products. |
| `/product/cooker-one-button` | Inspect the cooker's facts or request an itemized deal. Listings accept canonical catalog IDs. |
| `/presets` | Inspect 177 design modules and 20 presentation examples. Examples use the simulated catalog and leave the active shop untouched. See the [module inventory](docs/PRESETS.md). |
| `/harness` | Open **Explore the agent harness** from the results or category filters to test the standalone assistant, ordered catalog-backed cards and change receipts. |
| `/demo/better-auth` | Try the separate authentication example after configuring SQLite or D1. |

Once the storefront has loaded, ranking, questions, interviews and prices work locally. The browser suites also exercise supported offline navigation and switching views.

### Optional sourced catalog preview

Run `npm run dev:shopping` and open `http://127.0.0.1:5176` to try the standalone preview. It opens with seven dated listings and their photos. A configured same-origin API supplies the full catalog. After the published release has loaded, its checksum-verified copy is also available offline. Its interview applies on Finish. See the [standalone shopping guide](src/lib/mobile/README.md) for the optional local SQLite catalog and original images.

## How the store works

| Location | Responsibility |
| --- | --- |
| [Catalog](src/lib/catalog) | Product, shop, voucher and bilingual specification data. The fact resolver supplies both the raw value and its formatted display. |
| [Pricing](src/lib/pricing) | Basket quantities, shipping, voucher eligibility and the simulated coin balance feed one optimizer. The returned receipt drives the listing, cart and shelf. |
| [Personalization](src/lib/personalization) | A bounded store plan, deterministic ranking and explanations, the keyword fallback, and part-by-part validation of proposed changes. Listing answers cite a known fact or decline. |
| [Interview](src/lib/personalization/interview.ts) | Four optional questions map directly to settings for layout, information, priorities and reading. Review the changes before applying them. Skipped answers preserve existing settings. |
| [Storefront](src/lib/storefront) and [routes](src/routes) | Fixed rendering components, bilingual copy, product details, cart, change explanations, Undo and Reset. The fact checker compares rendered text and raw fact attributes with their source before showing proof. |
| [Standalone harness](src/lib/harness), [UI adapter](src/lib/harness-ui), and [bounded agent](src/lib/server/agent) | A separate route exercises validated card order, read-only catalog tools, guarded replies, visible traces and offline fallback. |
| [Storefront model handler](src/lib/server/live-assistant) | The hosted storefront and optional local assistant send allowlisted presentation hints. The server validates each returned setting. |

Browser storage holds validated presentation settings and cart items. Shared looks contain allowlisted presentation fields. Returning from a listing restores the interview and Undo history using a tab-local key. Raw conversations, credentials and model responses stay out of shared links. See the [system design](guidelines/SYSTEM-DESIGN.md), [trust and proof rules](guidelines/TRUST-AND-PROOF.md), and [demo journey](guidelines/JOURNEY.md).

## Chat with the hosted assistant

Open **Shopping assistant** and send **Give this shop a playful look.** The public Worker uses its existing server-side `OPENAI_API_KEY`. X-ray shows the model after a successful presentation request. Product questions use catalog citations, and deal requests use the pricing engine.

The public demo shares a lifetime allowance of 60 model requests, with a minimum of three seconds between reservations. The Worker reserves each call atomically in its existing D1 database. Offline chat stays available when the allowance is exhausted or the provider is unavailable. The guided interview uses local, bilingual questions.

## Optional local OpenAI test

Set `OPENAI_API_KEY` in the ignored `.env` file and leave the tracked sample blank. `OPENAI_MODEL` can select a model available to your project. The configured default is `gpt-5-mini`. Start `bun run dev --host 127.0.0.1`, open the printed loopback URL, then choose **Shopping assistant** → **X-ray** → **Try live model**.

Try “Make it minimal with a compact spec table” or “หน้าร้านดูจริงจังไป ขอจอยๆ หน่อย”. The provider receives only recognized presentation hints for theme, layout, density and language. Prices, catalog data, raw messages and conversation history stay in the app. A listing question and a deal request take their deterministic paths. X-ray distinguishes a model contribution, agreement with local settings and offline fallback. **Force offline** returns subsequent turns to the keyword fallback. The local pilot endpoint is restricted to loopback development. The standalone harness uses its own development endpoint; the local server projects the current request into allowlisted intent, catalog and presentation labels before contacting a provider. Its browser-based history and raw shopper text stay out of provider requests.

Two optional server-side tools report usage. `OPENAI_LOG_USAGE=1 bun run dev --host 127.0.0.1` logs reported token counts and supported cost estimates to the server terminal. `bun run scripts/evaluate-local-assistant.ts` makes billable requests for five fixed synthetic cases and compares the proposals with the fallback. Estimates apply to supported model pricing. Check the [provider usage dashboard](https://platform.openai.com/usage) for billing totals.

## Developing

From the repository root, install Chromium once, then run the checks below. The unit suite includes browser-based Svelte component tests. The production browser suite builds and serves the app. The separate development suite clears provider credentials and exercises request boundaries, pending turns and fallback.

```sh
./node_modules/.bin/playwright install chromium
bun run check
bun run test:unit --run
./node_modules/.bin/playwright test --config playwright.config.ts
./node_modules/.bin/playwright test --config playwright.local.config.ts
./node_modules/.bin/playwright test --config playwright.harness-local.config.ts
```

For the interview alone, run `bun run test:unit --run --project server src/lib/personalization/interview.spec.ts`. With Chrome installed, run `bun run build` followed by `./node_modules/.bin/playwright test --config playwright.interview.config.ts` for the English and Thai keyboard, catalog evidence and navigation journeys.

## Building

```sh
bun run build
bun run preview
```

The default adapter builds for Node. The Cloudflare adapter and D1 configuration are described below.

## Product and research

This branch implements the first research increment through **Shopping criteria**, independent presentation controls, product comparison and deal tasks. These use the existing interview, catalog evidence, pricing, chat and Undo. The report also proposes new compatibility checks and sharing a decision shortlist. Those extensions still need design and implementation. Shared looks currently carry presentation settings only. See the [product brief](guidelines/PRODUCT.md), [generative UI research report](docs/research/2026-11-21-generative-ui-ux-ui-report.md), [shopping workflow research](research/milestone-2-shopping-workflows.md), and [personas and measurement plan](research/milestone-1-personas-and-measurement.md).

## Choose your team assignment

In your own checkout, run `git fetch origin` and switch to your existing task branch. If you need a branch, run `git switch -c <your-branch> origin/main` with your chosen name. Open one assignment in a fresh Sol session and use its start prompt. Owner 4 coordinates the first contract PR while Owners 1–3 provide examples and begin independent checks. Each teammate commits and pushes to their own branch.

See the [team setup and security guide](docs/team-setup.md) for required tools, optional Codex skills by role, and repository access rules.

| Owner | Assignment                                                                          | Branch                 |
| ----- | ----------------------------------------------------------------------------------- | ---------------------- |
| 1     | [Catalog and pricing](docs/superpowers/plans/01-catalog-and-pricing.md)             | `feat/catalog-pricing` |
| 2     | [Personalization and agent](docs/superpowers/plans/02-personalization-and-agent.md) | Owner’s working branch |
| 3     | [Storefront and proof](docs/superpowers/plans/03-storefront-and-proof.md)           | Owner’s working branch |
| 4     | [Integration and release](docs/superpowers/plans/04-integration-and-release.md)     | Owner’s working branch |

See the [approved design](docs/superpowers/specs/2026-11-21-two-shopper-design.md) for the two-shopper rehearsal and the [contributor rules](AGENTS.md) for review and merge ownership.

Before merging, fetch current main, integrate it on the task branch, run the affected checks and obtain review from another contributor. Record the results for the exact combined revision. Commit and push to the assigned branch. The integration owner coordinates changes to shared contracts and production merges. The optional local tracker assembles relevant open PRs in a private Git repository and keeps the last complete candidate when a newer merge conflicts. See the [storefront branch sync guide](docs/storefront-branch-sync.md).

## Database configuration

The separate authentication demo uses the same SQLite schema and Drizzle queries with either a local SQLite file or Cloudflare D1. Its routes must be configured before use.

### Local SQLite

Set `DATABASE_URL` to a local SQLite file path, such as `local.db`, in the ignored `.env`. Set `ORIGIN` to your development URL and `BETTER_AUTH_SECRET` to a private high-entropy value. Then run the following commands from the repository root.

```sh
bun install
bun run db:push
bun run dev
```

### Cloudflare D1

Create a D1 database, replace `database_id` in `wrangler.jsonc` with its ID, and set `ORIGIN` and `BETTER_AUTH_SECRET` as Worker secrets/vars. Generate migration SQL from the shared schema and apply it locally or remotely:

```sh
bun run db:generate
bun run db:d1:local
# For the deployed database:
bun run db:d1:remote
```

In Cloudflare, configure `ORIGIN` as a variable and `BETTER_AUTH_SECRET` as a secret under **Workers & Pages → your Worker → Settings → Variables and Secrets**. Set them for **Production** and separately for **Previews Base**. `DATABASE_URL` is only needed for local SQLite; D1 uses the `DB` binding. These values are read at runtime, so they do not need to be supplied as build variables.

Run the app in the Cloudflare runtime with `bun run dev:d1`. The Worker reads the D1 binding from Cloudflare at request time. Node development uses the local SQLite database configured by `DATABASE_URL`. To deploy, run `bun run build:d1` and `bunx wrangler deploy`.

For local release verification, run `bun run build:d1` followed by `bunx wrangler deploy --dry-run`. The build checks both SvelteKit output and the assembled Worker for local environment files. Supply authentication bindings at runtime. Use the Cloudflare deployment record to verify which commit is serving production.

## Creating a project

This repository contains the existing SvelteKit app and both deployment adapters. For a separate experiment, the original scaffold used the minimal TypeScript template with Prettier, ESLint, Playwright, Vitest, Better Auth and Drizzle. See the [Svelte CLI](https://github.com/sveltejs/cli) for scaffolding.

## Adding features

Start with the relevant team assignment and its acceptance check. Changes to a catalog fact belong with the catalog owner, changes to a price calculation belong with the pricing optimizer, and new model-driven presentation choices need a validated plan field and a renderer in the fixed library. Include both languages and the offline path in the same change.
