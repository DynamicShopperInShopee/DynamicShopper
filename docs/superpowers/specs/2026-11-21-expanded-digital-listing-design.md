# Expanded digital cooker listing

**Status: accepted.** The user approved expanding the simulated catalog and media to fill the missing reference sections.

The approved expansion fills the missing mobile product-detail sections with a coherent simulated digital cooker, catalog-owned facts and locally bundled illustrative media. English remains the default; Thai has equal coverage. Reference composition guides the layout. No marketplace marks, real certifications or purported real buyer media are introduced.

## Approach

Enrich the existing `cooker-digital` item and its `/product/cooker-2` alias. Its name and canonical specs become a 2 L digital cooker with nine modes. Its existing price, shipping, power, warranty, ratings and ranking inputs remain authoritative. The one-button anchor remains a distinct item. This avoids contradicting its simple mechanical illustration and the core journey. Adding another SKU would unnecessarily change catalog size; placing new claims in components would break the fact boundary.

An optional catalog details record contains labeled factual rows. `getListingDetails(productId)` exposes section metadata and `resolveFact(productId, field)` resolves an exact allowlist of `detail.*` values. `+page.ts` projects these through the existing formatter and raw attributes. The renderer never invents factual copy. This record stays outside model context and the existing citation contract.

## Content and visual sequence

The digital listing contains a square gallery, demo review media attached to existing simulated excerpts, a horizontal local-video rail, seller shelf, extended specification sheet and a long description. The description follows opening portrait, nine mode icons, serving/capacity, preset timer, non-stick pot, heating diagram, soup, keep-warm, dimension diagram, six package items, highlights and technical information.

Canonical capacity/program count are reused. New simulated facts include preset 24 h, non-stick inner pot, all-round 360 degree heating, automatic keep-warm, overheat protection with a 3 s warning, dimensions 20 × 24.5 × 21 cm and weight 1.7 kg. Modes are boil, quick cook, steam, porridge, soup, stew, yogurt, cake and keep warm. Package items are the cooker, inner pot, rice paddle, measuring cup, power cord and manual. Local illustrations contain no baked factual labels or digits; HTML fact nodes provide them. Media is visibly described as simulated demonstration material in both languages.

## Acceptance

Every new fact resolves and formats in both locales; unknown/inherited fields decline. Detail facts are absent for unrelated products. Mode and package counts agree with their records. Catalog pricing and the one-button anchor remain stable. Search, the 2 L filter, seller links and the legacy alias reach the digital item. Images load, clips play only on demand, sheets scroll with a pinned close action, and all fact checks pass across four themes at phone and laptop sizes, offline included. No page scrolls sideways. Documentation and independent review accompany the changes.

## Static media provenance

The `src/lib/assets/products/digital-*.jpg` scenes were generated with OpenAI ImageGen for this demo. The common prompt kept one unbranded white rounded-square digital cooker with a blank display, consistent geometry, no words, numbers or logos, and space for HTML captions. Scene variants cover the blue hero, kitchen intro, serving rice, open inner pot, heat cutaway, soup, dining table, dimensions and six-item package contact sheet. JPEG exports are locally bundled. The three silent MP4 clips are locally encoded illustrative photo overviews, not buyer footage.
