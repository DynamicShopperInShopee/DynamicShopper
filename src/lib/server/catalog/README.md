# Sourced catalog backend

The local Node backend stores validated Shopee Thailand observations in a durable
SQLite database, separate from shopper presentation state and the local
authentication database. It uses the repository’s existing `better-sqlite3` dependency.

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
`127.0.0.1`. The preview works immediately with the bundled starter catalog. The optional
loopback service supplies additional records and images when available.

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
The observation times come from the imported records.
