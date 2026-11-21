# DynamicShopper

## Choose your team assignment

In your own checkout, run `git fetch origin` and switch to your existing task branch. If you need a branch, run `git switch -c <your-branch> origin/main` with your chosen name. Open one assignment in a fresh Sol session and use its start prompt. Owner 4 coordinates the first contract PR while Owners 1–3 provide examples and begin independent checks. Each teammate commits and pushes to their own branch.

See the [team setup and security guide](docs/team-setup.md) for required tools, optional Codex skills by role, and repository access rules.

| Owner | Assignment | Branch |
| --- | --- | --- |
| 1 | [Catalog and pricing](docs/superpowers/plans/01-catalog-and-pricing.md) | `feat/catalog-pricing` |
| 2 | [Personalization and agent](docs/superpowers/plans/02-personalization-and-agent.md) | Owner’s working branch |
| 3 | [Storefront and proof](docs/superpowers/plans/03-storefront-and-proof.md) | Owner’s working branch |
| 4 | [Integration and release](docs/superpowers/plans/04-integration-and-release.md) | Owner’s working branch |

See the [approved design](docs/superpowers/specs/2026-11-21-two-shopper-design.md) for the two-shopper rehearsal and the [contributor rules](AGENTS.md) for review and merge ownership.

## Database configuration

The app uses the same SQLite schema and Drizzle queries with either a local SQLite file or Cloudflare D1.

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
