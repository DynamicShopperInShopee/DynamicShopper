# Sourced catalog backend

The local Node backend stores validated Shopee Thailand observations in a durable
SQLite database, separate from shopper presentation state and the local
authentication database. It uses the already installed `better-sqlite3`; no package
was added. A separate Cloudflare Worker implements the same read-only API over
D1 and packaged original images. Its catalog tables share the existing D1 database
without changing unrelated authentication tables.

To import a separately staged, normalized `CatalogSnapshot`, run:

```sh
node scripts/catalog-server.ts --import data/shopee/catalog.json
node scripts/catalog-server.ts --port 4190
```

For browser access, run the shopping preview and use
`http://localhost:5176/api/catalog` through its proxy. Browsers block direct
requests to port 4190; that port is only the internal local backend listener.

`--database` overrides `data/catalog.sqlite`; `CATALOG_DATABASE_PATH` can also
set it. `--images` overrides `data/shopee/images`. The server binds only to
`127.0.0.1`. This package provides the standalone local server and a separate
catalog Worker; it does not add Node-backed SvelteKit API routes to the main
Cloudflare application. The standalone server does not require auth settings.
Cloud delivery lives in
[`deploy/catalog`](../../../../deploy/catalog/README.md), uses Fetch and D1, and
packages the standalone shopping frontend without the Node/auth scaffold.
Importing local SQLite and publishing the cloud catalog are separate actions.

Only these read operations are exposed:

- `GET /api/catalog`: `q`, `category`, `sort`, `maxPrice`, `page`, `pageSize`.
  The default page size is 24; the maximum is 100. The response includes the
  full-result count, current page, source snapshot, and category registry.
- `GET /api/catalog/snapshot`: the complete validated snapshot. The shop uses
  the seven bundled observations when the endpoint is unavailable, unless a previously saved full release passes the manifest checksum again.
- `GET /api/catalog/:id`: a listing identified by `shopId.itemId`.
- `GET /api/catalog/images/:id`: original locally cached JPEG, PNG, or WebP
  bytes from `data/shopee/images/:id.jpg`; missing images return 404. The
  endpoint never fetches an arbitrary remote URL.

Search terms are literal, case-folded, whitespace-separated terms joined with
AND. Search includes the preserved source titles and seller name. Filtering
and deterministic ordering happen before pagination. Catalog ordering follows
the imported record order; equal prices use the source identifier as the tie
breaker. An unavailable price stays null, sorts after known prices, and cannot
pass a price ceiling.

Imports reject foreign currencies, fractional/negative prices, duplicate
listing identities, mismatched Shopee source URLs, invalid source dates,
missing category metadata, and inconsistent counts before changing the
database. Every accepted field is copied from the normalized import; the
backend never translates titles, estimates facts, or rounds prices. Replacing
the active snapshot is one transaction, and repeating the same import is a
no-op. Existing readers see a consistent snapshot.

The product API is for the renderer. It is not an AI tool context: the separate
agent adapter must continue removing prices and other prohibited facts before
sending catalog information to a model.

Focused checks:

```sh
npx vitest run --project server src/lib/server/catalog/catalog.spec.ts
```

Decision: accepted durable catalog storage and read-only API at the user's
explicit request for a marketplace backend. Shopper preferences and Undo
remain client state; this change does not add accounts, checkout, ingestion
scheduling, or a public write API.

## Current local data and reuse

The 2026-11-21 import contains 1,500 unique listings across 122 source query
groups, observed at 14:22–14:32 Asia/Bangkok. `data/catalog.sqlite` is the durable
database, not browser state. Its data survives a server restart. A full local import needs an operator-supplied snapshot at
`data/shopee/catalog.json`. The [dataset guide](../../../../catalogs/shopee-2026-11-21/README.md)
identifies the original file and validated record checksums. Keep original
images in `data/shopee/images` and collection evidence under
`data/shopee/provenance`. The data directory, database and image cache are
ignored. A fresh preview can browse the seven bundled records without them.

To reuse the complete locally cached package,
retain the complete `data/shopee` directory and run `npm run catalog:import`,
then `npm run dev:catalog` and `npm run dev:shopping`. Reimporting the same
snapshot does not duplicate records. Back up a running SQLite database with
SQLite's backup mechanism, or stop the catalog server before copying its file.
There is no automatic price refresh. The accepted cloud path imports the same
validated snapshot into D1 and packages the original images as Worker assets;
local data files are not uploaded merely by pushing application code.

## Cloud catalog data and publication

Remote D1 import on 2026-11-21 was verified as 1,500 rows with 1,500 unique listing
IDs. Its validated-snapshot checksum is
`ff5cfb032f9a497e191700de474892924e290ef763a8fe4637dd8af4a93cf653`.
This verifies the database import; public Worker availability and its URL require
separate deployment and live smoke verification.

`scripts/export-catalog-d1.ts` validates source records, exports only catalog
tables and checks exact round-trip, repeat-import idempotence and unrelated-table
isolation. Changed imports invalidate metadata before replacing items and publish
metadata last, so interrupted imports do not advertise a complete mixed snapshot.
The Worker reads metadata and product results together using D1 batches. There is
no public import endpoint and no agent catalog-write path.

`deploy/catalog/prepare.ts` packages the built frontend and only original images
referenced by the validated snapshot. Database files, collection evidence,
credentials and unreferenced image files are excluded from public assets. The
Worker keeps `/api/catalog/*` separate from the app fallback, returns JSON errors,
and serves original JPEG/PNG/WebP bytes with their actual content type. Follow
[the cloud build and publication steps](../../../../deploy/catalog/README.md).
Neither D1 persistence nor Worker publication schedules new Shopee collection or
changes the observation date. Refreshing data remains an explicit validated import.
