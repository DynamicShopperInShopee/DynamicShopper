# Sourced shopping prototype

Run `npm run dev:shopping:cloud` to open the shopping UI on localhost using the
published 1,500-product cloud catalog and original images. The normal
`npm run dev` remains the existing SvelteKit application.

The shopper starts at the marketplace, optionally answers four short interview
steps, and receives one automatically applied, validated CNN presentation change.
The resulting receipt offers Undo and chat refinement. The three comparison
examples are inspection-only and cannot apply a view.

See [the shopping scope](../src/lib/mobile/README.md),
[versioned data and local reuse](../catalogs/shopee-2026-11-21/README.md), and
[cloud release verification](../deploy/catalog/RELEASE.md).

Browser evidence in `evidence/` shows the published storefront before and after
the CNN interview, plus the phone layout. Prices are dated observations; the
frontend cannot change catalog facts.
