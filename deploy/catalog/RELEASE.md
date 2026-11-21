# Catalog cloud release — 2026-11-21

The user authorized publishing the 1,500-product catalog to the cloud. The
configured target is the existing `dynamic-shopper` D1 database, bound to a new
`dynamic-shopper-catalog` Worker. This package serves the storefront, API and
1,500 original product images. It does not replace the existing main Worker.

## Verified before publication

- SQL preserves all 1,500 source records, 122 groups and original timestamps.
- Reimporting identical data performs no row changes; unrelated tables survive.
- A partial import cannot advertise a completed snapshot.
- Worker type checking and focused contract tests pass.
- A real local D1 runtime imported all 1,507 SQL statements successfully.
- Independent runtime verification traversed all 63 pages without duplicates,
  compared the complete snapshot, checked search and original JPEG/PNG bytes,
  and verified that unknown routes and public writes fail correctly.
- The deployment package includes only the built frontend and referenced images.
  No database files, raw observations, credentials or source maps are public assets.

## Published API verification

Cloud publication succeeded on 2026-11-21. The storefront and API are at
https://dynamic-shopper-catalog.nattawin-ya.workers.dev. The initial Worker
version was `8feda03a-ffae-4af6-adc1-ee9849d6d2e4`.

The existing D1 database had only its system table before import. Remote reads
confirmed 1,500 records and 1,500 unique product identities. Its source checksum
is `ff5cfb032f9a497e191700de474892924e290ef763a8fe4637dd8af4a93cf653`.
The public verification script passed exact snapshot equality, all 63 pages,
21 GameSir search matches, original JPEG/PNG MIME and byte equality, JSON 404,
read-only 405 and the frontend HTML response.

The interview-only presentation update was published as Worker version
`68713f36-8369-4035-82db-34f77bc5a395`. The catalog snapshot is unchanged.

Browser checks against that public release confirmed:

- All 1,500 records load; the first page contains 24 products.
- Completing the four-step interview automatically changes the grid to the
  validated CNN comparison layout, with no preview/Apply gate.
- The explanation identifies on-device CNN inference and its rule-derived
  training limitation; Undo restores the original grid in one step.
- All 48 rendered fact bindings (24 prices and source labels) remain identical
  before and after the interview, including raw values and visible text.
- The three inspection examples use grid, table and list layouts and expose no
  action that applies an example to the shop.
- Desktop 1440×900 and phone 390×844 have no document horizontal overflow.
  The English mobile interview opens and can be dismissed without changing the shop.

The isolated PR passed Svelte/typecheck with zero errors or warnings, 32 focused
server tests, four Worker tests, Worker typecheck and the standalone production
build. Fresh-clone development against the cloud API also returned the exact
versioned snapshot and original image bytes. See `preview/evidence` for browser
captures. The browser checks above are manual; authored Playwright scenarios
were not executed in this verification run.

## Publish and verify

1. Confirm Cloudflare authentication and access to the configured D1 database.
2. Inspect existing table names before writing. If catalog tables already exist,
   retain a catalog-only backup; do not restore or overwrite authentication tables.
3. Run `npm run catalog:export:d1` then `npm run catalog:import:d1`.
4. Check remote record count, unique IDs and snapshot checksum before deployment.
5. Run `npm run deploy:catalog` and retain the returned URL and version ID.
6. Run `npm run verify:catalog -- https://<published-worker-host>` and check the
   published storefront in a fresh browser origin at desktop and phone sizes.

## Failure and rollback

Do not publish if the remote count, checksum or source facts differ. An import
failure leaves the UI using its validated saved catalog or a clearly labeled
starter fallback; it must never claim the new snapshot is complete.

If a previously deployed Worker version exists and the release causes API
errors, roll back that Worker version. Restore catalog data only from its
catalog-only backup if required, then recheck the facts. Do not use a whole-D1
restore to undo this release because the database can contain unrelated tables.
For the first release, keep a failed deployment unpublished until fixed.

Prices remain observations captured at 14:22–14:32 Asia/Bangkok on 2026-11-21.
Publishing them does not add automatic price refresh or guarantee checkout terms.

## Stable orange branding update

Published as Worker version `7c9290ab-d4f7-4b6a-97b9-783fd78fa14c`.
The header, DynamicShopper mark and search action now use fixed brand tokens
independent of the shopper theme. Orange `#c43e1c` with white has a WCAG contrast
ratio of 5.18:1. Body layouts, density and details still adapt.

Browser verification on localhost checked standard, minimal, vibrant and large
print: the computed header and search backgrounds stayed `rgb(196, 62, 28)`.
On the published cloud release, completing the CNN interview changed the grid
to a minimal comparison table and preserved the same orange branding. See
`preview/evidence/cloud-orange-brand.jpg`. The cloud catalog still exposes
1,500 products. Localhost on port 5176 now uses the cloud catalog through the
development proxy.

The PR includes the latest main storefront/listing integration and adapts its
standalone interview to the shared `lockedFields` API. Both explicit-theme
regressions, all 32 focused tests, Svelte/typecheck, targeted ESLint and the
standalone production build passed after integration.
