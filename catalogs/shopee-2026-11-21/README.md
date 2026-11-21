# Shopee Thailand observations — 2026-11-21

The historical `CatalogSnapshot` contained 1,500 unique listing records
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

Run `npm run dev:shopping` and open `http://127.0.0.1:5176`. The preview
ships seven dated observations with their original photos. It uses the local
catalog service on port 4190 when available. A saved full release can supply
offline facts after the browser verifies its contents against the release checksum.

The [historical read-only API](https://dynamic-shopper-catalog.nattawin-ya.workers.dev/api/catalog)
and [dated snapshot](https://dynamic-shopper-catalog.nattawin-ya.workers.dev/api/catalog/snapshot)
are recorded as external sources. Local development works from the bundled records.

`manifest.json` records counts, the observation window, cloud URLs and two hashes:
the SHA-256 of the original catalog file and the checksum of the validated JSON
stored in catalog metadata. JSON whitespace and property ordering explain why
these hashes differ. Listing prices are retained exactly; they are never rounded
or computed by the presentation layer.

## Use a separately obtained full snapshot locally

Place the normalized snapshot at `data/shopee/catalog.json`. Verify it against
the manifest when reproducing this release. From the repository root, run

```sh
npm run catalog:import
npm run dev:catalog
```

Run the preview in another terminal. The [local catalog service](../../src/lib/server/catalog/README.md)
supplies the imported records over its read-only API. For full-size images put
each original at `data/shopee/images/<shopId>.<itemId>.jpg`. The server reads
the image bytes to identify the actual file format.

Git ignores the local `data` directory and a symlink at the same path. Keep the
staging cache, database and credentials private. Source URLs stay attached to
each observation for verification. Third-party content retains its original rights.
