# Reference Composition Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for the independent scoped tasks and independent final review.

**Goal:** Bring the full supplied search and product-detail reference closer through directly compared visual composition.

**Architecture:** Existing catalog-backed route data and local assets; small route-local presentation components. No pricing, catalog, agent or interview contract changes.

**Tech Stack:** Existing SvelteKit, scoped CSS, SVG, Playwright and Vitest. No dependencies.

**Spec:** `docs/superpowers/specs/2026-11-21-reference-composition-design.md`

## Global Constraints

- Catalog facts and raw metadata remain authoritative; numeric values use Plex Mono.
- Thai and English; four themes; 390×844 and 1440×900; large-print 20px/48px; no sideways scrolling or ambient motion.
- Keep current main's cart, interview, navigation and source validation. No new marketplace marks or invented claims.

## Review Focus

- Caption overlap with image subjects or other text, especially long English names and large Thai.
- Misplaced or unverified dimension values after moving them onto the diagram.
- Empty picture space or missing assets after dropping the repeated hero from the timer.
- Search sticky offsets after interview/header content and category changes.
- Deferred media and focus behavior while offline or navigating between cooker models.

## Task 1: Continuous digital description

Owner: scoped description implementer. Files: `DigitalCookerDescription.svelte`, `DigitalCookerPhoto.svelte`, `DigitalCookerModes.svelte`, `CookerModeIcon.svelte`, `DigitalCookerPackage.svelte`, new route-local timer/dimension components as needed, `digital-listing.e2e.ts`.

- [x] Implement intro/capacity caption placement, adjoining panels and larger unboxed modes from the spec; reuse exact projected fact rows.
- [x] Replace the timer's repeated hero with a large clock, and compose heating with its warning below.
- [x] Align dimensions to arrows and place technical facts beneath; group package art. Keep the plain final information rows.
- [x] Update existing browser assertions only for deliberate component changes (e.g. photo count). Add a meaningful assertion that dimension facts stay bound to the digital catalog and no header text clips in large print. Run scoped formatting and checks.

## Task 2: Search proportions

Owner: search implementer. Files: root search markup/CSS and `SearchQuickFilters.svelte`, `SearchShopPreview.svelte`, `CookerSearchSort.svelte` as justified by the measured audit.

- [x] Record measured initial/scrolled cooker and skincare differences, then adjust only those proportions and state-specific layout.
- [x] Preserve current main's interview, cart and explicit search controls; add regression coverage only where behavior changes.
- [x] Inspect both languages at phone/laptop sizes and run affected search E2E.

## Task 3: Review panel and whole-reference verification

Owner: integration. Files: `DigitalReviewMedia.svelte`, `ProductReviews.svelte` only if required, DESIGN and visual evidence notes.

- [x] Add the marked catalog summary above summary photos with a clear source label, without copying a buyer claim into UI prose.
- [x] Capture every reference section before/after; independent reviewer checks the actual composition and identifies any remaining gaps.
- [ ] Run affected E2E, type check, full unit/build as required by integration; sync main and obtain independent review.
- [ ] Publish a reviewable PR and verify preview/production according to existing authorization. Report actual remaining goal work, not an invented percentage.

## Observed comparison and review

At 390×844 in Thai, the first cooker photo row moved from y492 to y358 (the supplied reference, excluding OS chrome, is approximately y363). The expanded controls changed from 103px to 91px tall; their collapsed state no longer shifts the shelf by 47px. Skincare's first photos moved from y446 to y324. Its genuine single-shop preview remains shorter than the reference, which contains an additional shop action unsupported by this catalog.

The introduction starts about 11.5% into its portrait; the three-column mode panel adjoins the capacity scene. A large clock replaces the repeated timer photo. The dimension arrows now label their measurements, and the final information table includes those dimensions and weight too. Review-photo links were checked against the image at each destination after the timer changed.

Independent review covered both search categories, gallery and summary, reviews and video, seller rail/inventory, specifications sheet, every illustrated module, highlights and final information. Findings resolved: missing final dimensions, unmarked highlights, and the controls thumbnail's obsolete timer target. The reviewer checked Thai and English in standard and large print, fact verification, horizontal overflow, keyboard interview access and restored focus. No unresolved findings remain on that reviewed patch.

Intentional differences remain: simulated catalog facts and photos, DynamicShopper identity, neutral proof and action controls, no invented offers or seller metrics, no OS status bar, and language switching instead of duplicated bilingual listing prose. These are the selected product constraints, not unfinished layout work.
