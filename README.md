# DynamicShopper

DynamicShopper is a bilingual shopping prototype for the hackathon. Shoppers can ask for a different layout, a spec-first comparison, or a simpler Thai view for a family member. They can also select a preset, change their preferences, and undo changes directly. The same catalog supplies the product facts across all views, and the same optimizer calculates the voucher and coin total.

- **Demo on `/`.** Browse the mobile storefront and open **Shopping assistant** from the results heading.
- **Try two views.** In `/?view=receipt`, search for rice cookers and open **Compare views** to check shared product facts across different layouts. Open **Best price** to see the pricing calculation.
- **Test the model locally.** The deployed storefront works offline. Local development can optionally use OpenAI to propose presentation changes from a limited set of hints.

See the [demo journey](guidelines/JOURNEY.md), [product brief](guidelines/PRODUCT.md), and [system design](guidelines/SYSTEM-DESIGN.md).

The [shopping workflow research](research/milestone-2-shopping-workflows.md) proposes the next customizable, responsive views and defines their owner handoffs and acceptance checks.

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

## Running the storefront

The storefront and its offline shopping assistant run without a database or AI credentials. After `bun install --frozen-lockfile`, use `bun run dev` and open `/`. **Shopping assistant** in the results heading opens the adaptive receipt view and takes you to the message field area. To enter the receipt view directly, open `/?view=receipt`.

Use **Shopper views** to try the four presets, **Compare views** to check shared facts side by side, and **Best price** to open an optimizer receipt. **Undo** restores the previous store state. The assistant, comparison, and receipts work offline.

Run `bun run check`, `bunx vitest run`, and `bun run test:e2e` for the type, unit, and production browser checks. The production suite builds and serves the app locally.

## Optional local OpenAI test

Put your API key in the ignored `.env` file as `OPENAI_API_KEY`. Keep the tracked example blank. `OPENAI_MODEL` can select a model available to your API project and defaults to `gpt-5-mini`.

Run `bun run dev --host 127.0.0.1` and open `/?view=receipt` on the printed loopback URL. In **X-ray**, choose **Try live model** and send a presentation request such as “หน้าร้านดูจริงจังไป ขอจอยๆ หน่อย”. X-ray identifies live and offline results, and **Force offline** switches subsequent turns back to the fallback. Cloudflare and other production builds use the offline assistant and require no OpenAI key.

The local model receives a short list of allowlisted presentation hints. Product facts, prices, raw messages, and conversation history stay in the app. The model may propose a theme, layout, density or language. Listing questions and deal math use the existing deterministic paths.

Run `bunx playwright test --config playwright.local.config.ts` for the local browser security and fallback checks. That suite uses a separate development server with the provider credentials cleared.

Run `bun run scripts/evaluate-local-assistant.ts` to compare the model and fallback on five fixed synthetic presentation cases. This opt-in command makes billable API requests. It prints per-case matches, provider-reported token totals, and the estimated standard token cost for `gpt-5-mini`. Treat the results as smoke-test evidence.

To see per-request usage while testing in the browser, start the local server with `OPENAI_LOG_USAGE=1 bun run dev --host 127.0.0.1`. Only the server terminal receives token counts and any supported estimate. Requests with no reported usage and other API activity may still be billable. Check the [OpenAI usage dashboard](https://platform.openai.com/usage) for billing totals and the [model pricing page](https://developers.openai.com/api/docs/models/gpt-5-mini) for current rates.

## Database configuration

The separate authentication demo uses the same SQLite schema and Drizzle queries with either a local SQLite file or Cloudflare D1. Its routes must be configured before use.

### Local SQLite

Set `DATABASE_URL` to a file path in `.env` (the default is `local.db`), then run:

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

Run the app in the Cloudflare runtime with `bun run dev:d1`. The `DB` binding selects D1 automatically; without it the app uses `DATABASE_URL` and local SQLite. To deploy, run `bun run build:d1` and `bunx wrangler deploy`.

For local release verification, run `bun run build:d1` followed by `bunx wrangler deploy --dry-run`. Use the Cloudflare deployment record to verify which commit is serving production.

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
bunx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
bun x sv@1.7.0 create --template minimal --types ts --add prettier eslint playwright="demo:yes" vitest="usages:unit,component" better-auth="demo:password" drizzle="database:sqlite+sqlite:node-sqlite" --install bun my-app
```

## Adding features

Add features to your project with `sv add`:

```sh
bunx sv add
```

For example, to add Tailwind CSS:

```sh
bunx sv add tailwindcss
```

## Developing

Once you've created a project and installed dependencies with `bun install` (or `pnpm install` or `yarn`), start a development server:

```sh
bun run dev

# or start the server and open the app in a new browser tab
bun run dev -- --open
```

## Building

To create a production version of your app:

```sh
bun run build
```

You can preview the production build with `bun run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
