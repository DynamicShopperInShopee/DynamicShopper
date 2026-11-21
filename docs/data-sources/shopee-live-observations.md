# Public Shopee observations

Accepted: use current, visible public listing observations for the local catalog,
with source URLs and observation timestamps. The historical May 2025 dataset is
excluded from this import because the requested catalog needs current observed
prices.

The importer reads a separately collected JSON array, or an object with a
`rows` array. Each record contains:

```text
id, shopId, itemId, name, source, imageSource,
priceText, cardText, category: { id, name: { en, th } },
observedAt, priceSource
```

Identifiers remain strings. `observedAt` must be a timezone-qualified ISO
timestamp no more than one day old. `source` is the original listing URL,
including any selected-model query parameters; `priceSource` identifies the
page where its price was seen. `cardText` and `priceText` preserve the observation.
Capture `priceText` from the actual price element; do not parse it back out of
flattened `cardText`, which can concatenate a price and the following rating.
The importer does not fetch listing pages or infer prices from titles.

Run the boundary checks and inspect the current collection:

```sh
python3 scripts/import-shopee-observations.py --self-test
python3 scripts/import-shopee-observations.py --validate-only
```

While collection is still running, cache original photos without replacing the
active catalog:

```sh
python3 scripts/import-shopee-observations.py --cache-only
```

Only publish the requested final snapshot after its required count is present:

```sh
python3 scripts/import-shopee-observations.py --require-count 1500
```

The default input is `/private/tmp/shopee-live-observations.json`; `--input`
selects another captured file. The default output is
`data/shopee/catalog.json`, matching `CatalogSnapshot` in
`src/lib/catalog-api/types.ts`. `--output` can point to a separate development
snapshot. A smaller explicit `--limit` permits development imports;
`--no-images` keeps image fields null without requesting remote media.

Validation rejects fractional, ranged, missing, zero or negative prices and
preserves accepted whole-baht values exactly. The selected price text must occur
in the captured card. Numeric token checks reject demonstrable truncation, such
as `฿1` inside `฿1,290`, `฿1` inside `฿1290`, or `฿100` inside `฿100.50`.
Some cards concatenate the isolated price with a one-decimal rating and location
without a separator, such as `฿654.8จังหวัด…` for isolated price `฿65`.
This recognized shape is recorded as `flattened-rating-suffix` in the audit and
is not independent price proof. The separately captured visible price element
remains authoritative; the importer never reconstructs a price from that suffix.
The initial collection has this ambiguity in 323 of its 1,544 raw records and
312 of its selected 1,500 records. No other numeric suffix mismatch was found.
Product URLs must match the supplied shop/item IDs.
Duplicate IDs resolve to the most recently observed record; contradictory prices
at the same observation time are rejected. Category round-robin selection gives
deterministic coverage when more than the requested limit is available.
Output group IDs are `q-` followed by the first twelve hexadecimal characters of
the Thai source-query label's SHA-256 digest; original IDs remain in provenance.
These groups describe collection queries, not an official Shopee taxonomy.
The general-shopping demo excludes explicitly identified tobacco/vape, adult-toy,
drug and weapon terms. Its exclusions are counted in the audit; ordinary craft
glue guns are not excluded just because their Thai name contains the word for gun.

The original listing title is retained in both interface languages. Size,
seller identity, ratings, shipping and reviews are not inferred. Listing prices
remain subject to the selected variant and eligibility terms; they are not a
guarantee of a particular buyer's checkout total.

Images are requested only from the observed `down-th.img.susercontent.com` or
`down-sg.img.susercontent.com` file URL, with redirects checked against the same
allowlist. At most four downloads run concurrently. Authentication/access errors
and rate limits stop the import without replacing the prior catalog. There is
no retry or access workaround. The cache preserves original JPEG, PNG or WebP
bytes without conversion. The backend detects their MIME type from the bytes;
the internal cache filename remains stable with a `.jpg` suffix. Unsupported,
oversized or failed images remain null rather than being substituted. Their
source URL stays in the record. A source-URL sidecar prevents
an old photo being reused after the listing's image changes.

`provenance.json` retains the raw observations, rejected-row reasons, input
digest, selected rows and image outcomes. `image-cache-audit.json` records
cache-only runs. The collected input and visited page URLs can additionally be
retained as `provenance/observations.json` and `provenance/pages.json`, with their
SHA-256 digests in `provenance/files.json`. Use the observations file with
`--input` to reproduce the selection while it is inside the freshness limit.
These files and the image cache are local data, not code;
`data/shopee/` belongs in `.gitignore`. Import failures never erase the last good
snapshot. A successful file import is not evidence that every listing is still
available or that a later live price cannot change.
