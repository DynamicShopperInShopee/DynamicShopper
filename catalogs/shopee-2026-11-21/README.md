# Shopee Thailand observations — 2026-11-21

This versioned `CatalogSnapshot` contains exactly 1,500 unique listing records
and 122 source-query groups. Prices were observed on public Shopee pages from
14:22:40 to 14:32:18 Asia/Bangkok on 2026-11-21. Names, whole-baht prices,
shop/item identities, original listing and photograph URLs, and observation
timestamps remain attached to each record. Group names describe collection
queries, not an official marketplace taxonomy.

These are dated listing observations. Selected variants and buyer eligibility
conditions may affect checkout. Publication does not refresh a price or establish
stock, shipping, ratings, reviews, seller identity or specifications. Unknown
fields stay unknown. See [collection provenance](../../docs/data-sources/shopee-live-observations.md)
for validation and the flattened-card-text audit limitation.

## Use the catalog

From a fresh clone with dependencies installed, run:

```sh
npm run dev:shopping:cloud
```

Open `http://127.0.0.1:5176`. The Vite development proxy forwards `/api/catalog`
and its image routes to the published cloud Worker, so this mode needs no local
database or downloaded image cache. The ordinary `dev:shopping` command instead
expects the separate local catalog server on port 4190. This proxy setting is
for development; a production cloud build uses the Worker's same-origin API.

The [published storefront](https://dynamic-shopper-catalog.nattawin-ya.workers.dev)
uses the [read-only catalog API](https://dynamic-shopper-catalog.nattawin-ya.workers.dev/api/catalog).
The [complete snapshot](https://dynamic-shopper-catalog.nattawin-ya.workers.dev/api/catalog/snapshot)
has the same DTO as `catalog.json`. Image paths such as
`/api/catalog/images/<shopId>.<itemId>` resolve against that cloud origin.

`manifest.json` records counts, the observation window, cloud URLs and two hashes:
the SHA-256 of the exact versioned file and the checksum of the validated JSON
stored in catalog metadata. JSON whitespace and property ordering explain why
these hashes differ. Listing prices are retained exactly; they are never rounded
or computed by the presentation layer.

To import the versioned metadata into the local backend or generate catalog-only
D1 SQL, run from the repository root:

```sh
node scripts/catalog-server.ts --import catalogs/shopee-2026-11-21/catalog.json
node scripts/export-catalog-d1.ts --input catalogs/shopee-2026-11-21/catalog.json --output data/shopee/catalog-d1.sql
```

The exporter validates every record and checks a fresh SQLite round trip before
writing SQL. It does not access the cloud. Remote import and deployment remain
explicit operator actions; see [cloud delivery](../../deploy/catalog/README.md).

## Rebuild the cloud image package

The storefront bundles `catalog.json` for offline browsing. A validated response
from the read-only API updates the open session. The full set of original product
photographs is served separately from the bundled catalog metadata. The
seven small starter-fallback photographs under `src/lib/assets/shop` are a
separate fallback dataset. Raw page observations and database files are also
excluded from this versioned snapshot.

Cloud packaging expects the selected catalog at `data/shopee/catalog.json` and
each original photograph at `data/shopee/images/<shopId>.<itemId>.jpg`. Restore
that local staging cache from the original collection or the corresponding
published image API responses, preserving the bytes. A stable `.jpg` filename
can contain PNG bytes; the backend detects the actual MIME type.

Copy this versioned `catalog.json` to that staging path before packaging. The
`data` path is ignored even when it is a local symlink; no developer-specific
symlink or cache is required by the cloned repository. A fresh clone must supply
its own staging directory only when using local image serving or rebuilding the
complete cloud asset package.

After staging the images, run `npm run build:catalog:cloud` to build the current
shopping frontend and invoke `deploy/catalog/prepare.ts`.
The preparation script copies the existing `preview/dist` build and only the
photographs referenced by the validated catalog into generated
`deploy/catalog/dist/assets`; it does not compile the UI or retrieve images.
Keep generated assets, the staging cache, SQL, credentials and database files
out of Git. The source URLs remain available for checking each observation;
this dataset does not assert a broader license over third-party content.
