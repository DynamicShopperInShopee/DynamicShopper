# DynamicShopper

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

The storefront and its offline shopping assistant run without a database or AI credentials. After `bun install --frozen-lockfile`, use `bun run dev` and open the root route. The mobile storefront is the default at `/`. Its shopping assistant link opens the adaptive receipt view at `/?view=receipt`.

The default storefront also offers **Start a quick interview**. Answer or skip each
question, review the proposed view, then select **Apply my view**. The existing
catalog shelf becomes an adaptive receipt view in place. Search, category, capacity,
budget and explicit sort remain in effect. **Refine this view in chat** focuses the
existing offline assistant; Undo restores the preceding view and interview answers.
Closing the interview discards the draft.

The interview runs an exported synthetic-trained CNN locally, without a model API
or web ML dependency. It proposes allowlisted layout, information, sections and an
unlocked theme. Reading settings and priorities follow explicit answers. Partial
answers, disabled inference and inference errors retain the direct-answer path.
This demonstrates a working interaction, not measured preference accuracy with
real shoppers. Catalog facts and the voucher optimizer are unchanged.

Focused validation: `bun run test:unit --run --project server src/lib/personalization/interview.spec.ts`.
The interview browser journeys are in `src/routes/interview.e2e.ts`; after a
production build, `npx playwright test -c playwright.interview.config.ts` uses
installed Chrome and an isolated preview port.

Validation of this integration on 2026-11-21: the Node production build, Cloudflare
build, targeted lint and 32 targeted unit tests pass. Interactive browser checks
confirmed marketplace → interview → large-print comparison → offline chat list
refinement → Undo to comparison → Undo to marketplace. Desktop (1440×900) and
phone (390×844) default storefronts and the mobile interview were inspected
without page overflow; skipping every question leaves the marketplace unchanged.
The automated browser
journeys are authored but were not executed in this session. Full Svelte check
still reports the two pre-existing `personalization/contract.spec.ts` errors:
missing `applyTurn` and the missing `contract-sample` fixture; no new diagnostics
were reported. This is a local integration, not a deployed release.

## Optional local OpenAI test

Put your API key in the ignored `.env` file as `OPENAI_API_KEY`. Keep the tracked example blank. `OPENAI_MODEL` can select a model available to your API project and defaults to `gpt-5-mini`.

Run `bun run dev --host 127.0.0.1` and open the printed loopback URL. In **X-ray**, choose **Try live model** and send a presentation request such as “หน้าร้านดูจริงจังไป ขอจอยๆ หน่อย”. X-ray identifies live and offline results, and **Force offline** switches subsequent turns back to the fallback. A production build runs the storefront offline.

The local model receives a short list of allowlisted presentation hints. Product facts, prices, raw messages, and conversation history stay in the app. The model may propose a theme, layout, density or language. Listing questions and deal math use the existing deterministic paths.

Run `bun run scripts/evaluate-local-assistant.ts` to compare the model and fallback on five fixed synthetic presentation cases. This opt-in command makes billable API requests and prints per-case matches without printing keys or provider payloads. Treat the results as smoke-test evidence.

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
