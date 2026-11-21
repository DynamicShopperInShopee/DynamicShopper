# sv

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
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
bun x sv@1.7.0 create --template minimal --types ts --add prettier eslint playwright="demo:yes" vitest="usages:unit,component" better-auth="demo:password" drizzle="database:sqlite+sqlite:node-sqlite" --install bun my-app
```

## Adding features

Add features to your project with `sv add`:

```sh
npx sv add
```

For example, to add Tailwind CSS:

```sh
npx sv add tailwindcss
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
