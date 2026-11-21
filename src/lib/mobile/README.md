# Sourced marketplace shopping prototype

Run `npm run dev:shopping` and open http://127.0.0.1:5176 for the standalone
preview. The first offline visit shows seven sourced listings and their photos. For the
local SQLite catalog and original images, follow the
[dataset guide](../../../catalogs/shopee-2026-11-21/README.md), start
`npm run dev:catalog` in another terminal, and reload the preview. The
[catalog backend](../server/catalog/README.md) documents the read-only API.

`preview/main.ts` mounts `MobileShop.svelte`. The production SvelteKit home and
`/harness` keep their existing shopper journeys. The preview can browse its
bundled observations and original photos immediately, including when the local
API is unavailable.

The standalone preview opens a shopping page under the DynamicShopper
identity: orange search header, gray ground, shop navigation, filters and product
grids. `marketplace.css` spans the desktop viewport with a centered content area;
phones use two product columns, while large print uses one. Verify at 1440×900
and 390×844. The previous narrow, 480px-capped presentation is retired.

This baseline is an explicit user-authorized exception to the older prohibition
on marketplace chrome. It does not permit invented promotions, stock, ratings,
review counts or shipping claims, and it does not imply Shopee affiliation.

## Store first, interview, then chat

Start at the ordinary shop. Select **Personalize with a quick interview** /
**ตอบสั้น ๆ เพื่อปรับมุมมอง**. The sheet presents one question at a time with four
choices. **Next** / **ถัดไป** advances, **Back** / **ย้อนกลับ** preserves the draft,
and **Skip — keep my current settings** / **ข้าม — ใช้การตั้งค่าปัจจุบัน** moves on
without changing the skipped setting. On the final question, **Finish interview** /
**ตอบเสร็จแล้ว** immediately validates and applies one answer-based proposal,
closes the sheet, and focuses the changed shelf. Final-step Skip also completes
the interview with skipped settings preserved. A receipt explains the actual
changes and exposes Undo and **Chat to refine** / **แชตปรับต่อ**. Undo restores
the prior view and interview metadata; Close/Escape before completion cancels
the draft without changing the shop.

In this standalone preview, finishing the interview applies the presentation
selected from the shopping answers. The main storefront separately previews
changes and lets the shopper choose Apply.

## Compare example answers

For an immediate visual comparison, open
`http://127.0.0.1:5176/?view=interviews` or choose **Compare example answers** /
**เทียบตัวอย่างคำตอบ**. The default examples show an image grid, a compact spec
table, and a spacious large-print list. They use the same `ShopShelf.svelte` as
the live shop. Above 1000px they appear side by side; smaller windows stack them.
Expand **Edit answers** to update a pane. **Show what controls each part**
identifies explicit answers and the default theme.

Previewing and editing example answers never change the shop. This is an
inspection demo with no **Use this view** action or callback to store state.
The actual interview is the entry to personalizing the live shop. Its validated
proposal retains existing filters, saved products and explicit locks; completion
returns focus to the shelf so the visual difference is immediately visible.

Example answer sequences for the interview or comparison workspace:

- Compare → Specs → Durability → Large text: spacious large-print comparison,
  with sourced size information leading and image tiles removed.
- Browse → Pictures → Value → More space: picture grid with more space between products. The current theme stays selected.
- Buyer reviews: an honest unavailable-data note, not invented reviews.

Use the receipt's **Edit answers**, removable chips, **Undo**, or **Reset view**.
Reset keeps the current language. Close/Escape cancels an unfinished draft.
Complete and partial interviews use the same fixed mapping in
`src/lib/personalization/interview.ts`. The goal sets the layout and sections,
the evidence answer selects card details, the priority answer records the
shopper’s priority, and the reading answer sets spacing. Choosing large text
also selects the large-print theme. Skipped questions retain current settings.
Once the app has loaded, these choices work offline. This snapshot
has no verified value/performance/durability/rating scores, so choosing those
priorities cannot legitimately rank these listings. Unsupported review and
recommendation sections stay absent; the product shelf remains available.
The supported What matters section shows catalog-backed use choices before
the shelf when requested. Photo cards lead with pictures, summary cards lead
with facts, and comparison tables change image rows and fact order by recipe.

Verification commands:

```sh
npx vitest run --project server src/lib/catalog-api/client.spec.ts src/lib/mobile/engine.spec.ts src/lib/mobile/interview.spec.ts src/lib/personalization/interview.spec.ts
npx playwright test -c preview/playwright.config.ts
```

If using an installed Chrome rather than Playwright's downloaded Chromium, prefix
the browser command with `PLAYWRIGHT_CHANNEL=chrome`.

## Reused code, without a merge

`src/lib/catalog`, `src/lib/personalization`, and local Plex fonts were copied
unchanged from `feat/catalog-pricing` at
`41b32539f7f6ab082bf3b494a7c01efc236ca691` using `git show`. No merge,
cherry-pick, commit or push was performed. The synthetic catalog remains an
internal dependency of that branch's interpreter; it is never the mobile shelf.
The mobile code reuses its plan types, persona presets, offline interpreter,
validator and currency formatter. `engine.ts` is the explicitly scoped bridge.

This local adapter predates full integration with the shared Owner 2 contract.
It is not a claim that the full `applyTurn`, shared explicit-field locks, agent,
golden-set or optimizer integration is complete. It retains only presentation and budget
patches from the existing interpreter. Ask/deal results cannot transfer catalog
references from the synthetic catalog into the real shop UI.

## Backend catalog and offline use

The shop starts with seven sourced listings and their photos, then requests
`GET /api/catalog/snapshot` from the same origin. A response must pass the
catalog checks for shop and item IDs, source URLs, image provenance, prices,
dates and group counts before any layout uses it. A complete release whose
canonical JSON matches the SHA-256 checksum in the release manifest can be saved
for a later offline visit. The shop checks the checksum again before using that
copy. If verification or browser storage is unavailable, the starter listings
remain usable. All shop, interview and comparison views share the active catalog.

Search, group filters and budget filters operate on the complete loaded snapshot.
Grid, list and comparison table then render the same page of up to 24 products.
The table uses one product per row. Presentation changes preserve the page;
filter and order changes reset to the first page, and Undo restores the captured
view. Product groups describe the source queries used to collect observations,
not a verified official marketplace taxonomy. All groups are available in a
select, with bounded shortcut lists. Unknown prices or specifications stay
unknown, and unknown prices are excluded from budget results. Prices and any
source qualifications remain attached to their original records. Product titles carry the
listing ID and original localized name in cards, comparison tables and details.
Each listing’s group label carries its raw group ID and the catalog’s display
name for the active language.

The page reports the actual catalog count, observation date and whether it loaded
from the API, a verified offline release or the starter catalog. This is an observation
snapshot, not a promise of current checkout prices, stock, ratings or shipping.
Original names and photos are retained; an untranslated source name is not
replaced with an invented English name. Each import retains its observation date. Interview mapping and keyword refinement
run in the browser.

## Starter source observations

Retrieved through cached public Shopee pages on 2026-11-21, not a live API.
All seven listings belong to [unilever_householdcare](https://shopee.co.th/shop/58418206).
`shop-data.ts` records each saved amount, retrieval date, seller, product URL,
price-observation URL and original image URL. Card and table values use that
record; selected variants and current checkout terms must be checked at source.

| Listing                                | Product source                                               | Price-observation source                                                                   |
| -------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Breeze Matic detergent                 | [Listing](https://shopee.co.th/product/58418206/41776476003) | [Shop page](https://shopee.co.th/shop/58418206)                                            |
| Sunlight Lemon dishwashing liquid      | [Listing](https://shopee.co.th/product/58418206/54301508830) | [Shop page](https://shopee.co.th/shop/58418206)                                            |
| Breeze Quick Wash laundry liquid       | [Listing](https://shopee.co.th/product/58418206/42908480312) | [Breeze search page](https://shopee.co.th/list/บรีส)                                        |
| Sunlight dishwashing liquid multipack  | [Listing](https://shopee.co.th/product/58418206/10482842392) | [Shop page from listing](https://shopee.co.th/unilever_householdcare?entryPoint=ShopByPDP) |
| Breeze Excel Gold front-load detergent | [Listing](https://shopee.co.th/product/58418206/13622158377) | [Breeze search page](https://shopee.co.th/list/บรีส)                                        |
| Breeze & Comfort Pure Happy set        | [Listing](https://shopee.co.th/product/58418206/58006302772) | [Breeze search page](https://shopee.co.th/list/บรีส)                                        |
| Breeze liquid detergent gallon         | [Listing](https://shopee.co.th/product/58418206/42226467434) | [Breeze search page](https://shopee.co.th/list/บรีส)                                        |

All seven original listing photographs are bundled under `src/lib/assets/shop`.
The exact remote sources remain in each record's `imageSource`. Gallery images
were selected to exclude dated sale banners. The earlier missing Sunlight photo
has been replaced with its verified original listing image.

A previously recorded Breeze promotion is not shown as a generic product detail;
expanded catalogs cannot inherit a promotion by array position. Search-card amounts can also refer to a
different selected variant from a product page, so the UI retains the original
observation and names that limitation instead of resolving it by inference.

Names are shortened bilingual display labels; sizes retain the source's ranges
and pack options. Shipping, stock, review counts, exact selected variants and
voucher stacking remain unknown. There is no assumed free shipping, invented
rating, fake scarcity, unit-price comparison or synthetic discount. Deal
requests explain missing information rather than use the synthetic optimizer.

## Recorded catalog checks

The imported backend on 2026-11-21 contains exactly 1,500 unique listings and
122 source query groups. All original photographs are cached locally. The
SQLite snapshot exactly matches the normalized import; API traversal covers
all 63 pages without duplication (24 per page, 12 on the final page). Search,
filtering, deterministic sort, detail responses and original image MIME/bytes
were checked. Two fresh database connections and a complete server restart
retained the same snapshot.

## Historical browser checks: separate Apply version

Before the accepted automatic-completion flow, browser checks on the imported
snapshot verified the following behavior. They are evidence for that earlier
UI and do not verify the new Finish interview interaction:

- Thai default marketplace at 1440×900 and 390×844 with no page overflow.
- Interview draft leaves facts unchanged; Apply switches grid to table; chat
  switches to list; Undo restores table. All 48 rendered fact keys, raw values
  and visible text on the first page remain identical through those changes.
- The comparison workspace shows grid/table/list backed by the same 1,500-item
  catalog, with identical prices for all 24 products on the displayed page.
- English carbon-blue, large-print and minimal/table views fit a 390px phone.
  The checked large-print prices render at 20px.
- An earlier browser-storage implementation retained 1,500 records across a
  reload with the local server stopped. The current implementation requires
  the saved content to match the published release checksum.

These historical checks covered the catalog and page layouts. The preview ships
the starter photographs. Images for API-supplied listings require the image
service or a previously loaded copy in the browser's HTTP cache.

Targeted catalog-client tests cover a synthetic 1,500-record boundary fixture,
full-snapshot search, all-page traversal, source link validation,
unknown prices and identical raw prices in the three 24-item shelf layouts.
These synthetic fixtures are test-only and never enter the storefront catalog.
## Automatic interview completion: verification status

The accepted current journey is store → interview → Finish interview → changed
shop and receipt → chat → Undo. Verify that incomplete drafts remain inert,
skipped settings survive completion, one changed proposal creates one Undo step,
and comparison examples cannot apply a view. Also compare the same catalog
facts before and after completion and after Undo in Thai and English at desktop
and phone sizes. These are required checks, not a report that they have run.
Run the current Finish and Undo checks using
`node_modules/.bin/playwright test --config preview/playwright.config.ts`.

## Decisions

- Accepted: real shop snapshots and original product photography, per the user's
  request, supersede the original synthetic-only prototype scope for this UI.
- Accepted: Shopee-inspired marketplace baseline, per the user's explicit request;
  a familiar shop must appear before personalization.
- Accepted: keep DynamicShopper's independent identity and receipt surfaces for
  change explanations and sourced price details.
- Accepted: optional four-step interview whose completion applies one validated,
  undoable proposal automatically, then explains the change and offers chat.
- Superseded: a separate preview/Apply gate, main-shop UI preset/theme selection,
  and applying a comparison example; the shopper describes needs through the
  interview and the system selects presentation.
- Deferred: full shared Owner 2 contract integration in this local adapter.
- Accepted: sourced starter listings and checksum-verified offline reuse of the full release.
- Accepted: an optional local SQLite catalog and original image service behind the preview’s read-only API.
- Deferred: continuous ingestion, checkout calculation and production agent integration.
