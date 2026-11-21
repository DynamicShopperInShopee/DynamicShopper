# Cloud catalog worker

Published storefront: https://dynamic-shopper-catalog.nattawin-ya.workers.dev

Reusable API: https://dynamic-shopper-catalog.nattawin-ya.workers.dev/api/catalog

Remote verification confirms exactly 1,500 source records across 63 pages and
122 groups, matching the complete imported snapshot and original JPEG/PNG bytes.

This separate `dynamic-shopper-catalog` Worker serves the shopping preview,
original cached product photographs, and the read-only catalog API. It binds the
existing `dynamic-shopper` D1 database. The main `dynamic-shopper` Worker and its
authentication tables are untouched. Runtime code uses only Fetch and D1 APIs;
there is no Node compatibility flag, filesystem access, or SQLite native module.

The public API preserves the Node backend contract: `/api/catalog`,
`/api/catalog/snapshot`, `/api/catalog/:id`, and `/api/catalog/images/:id`.
Query validation is shared with the local backend. D1 batches metadata, counts
and item reads together. Missing catalogs return 503 so the validated browser
cache can be used; unknown API paths return JSON 404, never the app shell.
No public endpoint imports data or changes a product fact.

To try the sourced storefront from a fresh clone, use `npm run dev:shopping:cloud`
and open `http://127.0.0.1:5176`. This development proxy uses the published API
and images; it does not require the ignored local `data` directory. Versioned
metadata and the manual image-staging requirements for a complete rebuild are
documented in [the dataset guide](../../catalogs/shopee-2026-11-21/README.md).

From the repository root, prepare a deployment locally:

```sh
npm run build:catalog:cloud
node scripts/export-catalog-d1.ts
npx tsc -p deploy/catalog/tsconfig.json
node --test deploy/catalog/worker.test.ts
npx wrangler deploy --config deploy/catalog/wrangler.jsonc --dry-run --outdir dist/worker
```

Always run `build:catalog:cloud` after frontend edits: it builds the current
source and then packages that build. Calling `prepare.ts` alone only copies an
existing `preview/dist`; a successful package does not prove the UI is current.
`prepare.ts` packages only the built frontend and images referenced by the
validated catalog. Source/provenance files, credentials, and database files are
not placed in public assets. Image API responses sniff the original byte format
because stable `.jpg` cache names can contain PNG or WebP originals.

For a local D1 check, with no remote mutation:

```sh
npx wrangler d1 execute DB --config deploy/catalog/wrangler.jsonc --local --file data/shopee/catalog-d1.sql
npx wrangler dev --config deploy/catalog/wrangler.jsonc --local --port 8791
```

After the authorized operator checks the package and authenticates Cloudflare,
the explicit publishing commands are:

```sh
npx wrangler d1 execute DB --config deploy/catalog/wrangler.jsonc --remote --file data/shopee/catalog-d1.sql
npm run deploy:catalog
node scripts/verify-catalog-deployment.ts https://dynamic-shopper-catalog.nattawin-ya.workers.dev
```

Import the catalog before publishing the Worker. The SQL exporter manages only
catalog tables and preserves unrelated tables. Deployment makes a dated observed
snapshot available in the cloud; it does not enable continuous Shopee ingestion,
checkout, accounts, or an agent catalog write path. Shopper presentation state
and Undo remain in the browser. After publishing, also open a fresh browser and
confirm the storefront displays the full catalog and current interview flow;
an API-only smoke check cannot detect stale frontend assets.

References: [Cloudflare asset bindings](https://developers.cloudflare.com/workers/static-assets/binding/)
and [D1 database batches](https://developers.cloudflare.com/d1/worker-api/d1-database/).
