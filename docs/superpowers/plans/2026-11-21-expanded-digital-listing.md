# Expanded Digital Listing Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement the scoped tasks.

**Goal:** Fill the reference's missing digital-cooker sections with coherent catalog facts and local illustrative media.

**Architecture:** Optional catalog detail rows resolve through the existing fact formatter and verifier. Route-local components render fixed sections and an allowlisted media manifest. Existing pricing and model contracts remain unchanged.

**Tech Stack:** Existing SvelteKit, TypeScript, Playwright and Vitest; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-21-expanded-digital-listing-design.md`

## Global Constraints

- All displayed claims and numbers come from the catalog; Thai and English both work.
- Preserve existing pricing inputs, one-button anchor, catalog IDs and count.
- No Shopee marks or real certifications. Generated review examples are disclosed as simulated.
- 390×844 and 1440×900, four themes, 20px/48px large-print floor, no sideways scroll.

## Review Focus

- Unknown and inherited detail keys never resolve.
- Repeated spec values agree with canonical capacity/program count.
- New details never enter model context or weaken citation validation.
- Media on digital and one-button items stays distinct through navigation.
- Late media loading, offline use and long specification scrolling preserve usable controls.

## Task 1: Catalog detail facts

Files: `src/lib/catalog/listing-details.ts`, catalog types/facts/index/products, `guidelines/CATALOG.md`, `listing-details.spec.ts`.

- [x] Add failing tests for bounded resolution, bilingual formatting, digital mode/package counts, unchanged anchor/pricing, and unrelated/hostile keys.
- [x] Implement `getListingDetails(productId): ListingDetails | undefined`. Records expose `features`, `modes`, `dimensions`, `packageItems`, `highlights`, `technical`, and `reviewMedia`. Each `DetailRow` contains `field`, `label`, `raw`, `unit`; review media contains `reviewField`, allowlisted `mediaId`, and `captionField`.
- [x] Use `detail.presetHours`, `coating`, `heatingAngle`, `keepWarm`, `warningSeconds`, `width`, `depth`, `height`, `weight`, `packageCount`, exact `mode.*`, `part.*`, and `media.*` fields. Add required `cm`, `deg`, `s`, `kg` units to fact formatting and compatible contract type declarations only.
- [x] Set digital name/specs to 2 L/nine modes. Document simulated detail values from the design. Run catalog and pricing tests; report existing baseline failures separately.

## Task 2: Fixed description and sheet

Files: product `+page.ts`, new `DigitalCookerDescription.svelte` and small related components, `ListingInformation.svelte`, `SpecificationsSheet.svelte`, product E2E.

- [x] Add a failing browser check for the digital alias, nine mode facts, six parts, extended sheet, bilingual proof and unchanged anchor.
- [x] Project optional detail rows via `presentFact`; do not expose raw product records in route rendering.
- [x] Render the sequence from the design using fixed local asset IDs supplied by Task 3. Keep HTML captions outside image pixels and labels outside factual node text.
- [x] Include optional technical/dimension/feature rows in the sheet with existing focus and scrolling behavior.
- [x] Verify loaded images, offline facts, phone/desktop layout and navigation between listing types.

## Task 3: Local digital media and galleries

Files: digital assets and manifest under `src/lib/assets/products`, route-local digital gallery/review media components, `ProductReviews.svelte`, product page and shelf photo CSS.

- [x] Generate one coherent unbranded digital cooker and reference-consistent scenes without embedded text/numbers.
- [x] Bundle optimized assets and silent overview clips; keep references local and allowlisted.
- [x] Add gallery and review examples for digital only. Label simulated media in both languages and attach it to existing catalog excerpts. Include accessible on-demand playback and focus return.
- [x] Use the same hero image for the digital search card, seller shelf and gallery. Verify no blank images or mismatched models.

## Task 4: Integration and review

- [x] Run affected catalog/pricing tests, all route E2E, build, type check and formatting checks.
- [x] Inspect every new section in Thai/English and all four themes at both supported sizes. Inspect rendered fact metadata and offline playback.
- [x] Obtain independent producer/consumer and final visual review, resolve concrete findings, update DESIGN and CATALOG together.
- Publish through a reviewable PR/branch preview. Record deployment verification and completion limits in that PR so release status remains current.

## Integration decisions and evidence

- Accepted: keep the already merged cart, interview, session and fact-verification flow from main `50a9171`; the expansion adds only catalog detail data, fixed listing sections and local media.
- Resolved: restore Thai timer search with a catalog tag; correct scene alt text; use mono for the voltage range; distinguish simulated video navigation labels from photo captions; explicitly identify simulated review search.
- Resolved: move the phone gallery shop caption below the combined header/cart controls in every theme, with a bilingual overlap regression test.
- Independent design, producer/consumer, media, conflict-resolution and visual reviews were completed. All sixteen locale/theme/viewport combinations loaded their images and verified the rendered facts.
- Production build passed; server unit tests: 107 passed with the same five pre-existing personalization contract failures; client unit tests: 78 passed. Type checking reports only the same two unresolved imports in `personalization/contract.spec.ts`, with no warnings. Production E2E passed 112 with the development-only poisoned-model case skipped; that case passed separately in development.
- After the final phone-caption fix, all nineteen affected listing tests passed on a fresh production Worker. Independent English/Thai phone inspection confirmed the caption clears navigation, with verified facts and no sideways scroll.

### Final main integration

Main `385eccb` includes the team's contract repairs and standalone harness. It merged cleanly and passed independent review of the new agent/catalog boundary. On the resulting tree, all 360 unit tests passed (one credential-dependent live-model test skipped), type checking reported zero errors and warnings, and production E2E passed 118 cases (the development-only poison case skipped in production). The Cloudflare build passed. These results supersede the earlier baseline-failure counts.
