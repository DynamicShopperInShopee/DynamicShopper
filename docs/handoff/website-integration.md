# Agent harness integrated into the PR #9 storefront

Baseline: merged PR #9, commit `63f9345`. Branch: `codex/website-agent-harness`. Rebased onto `e248361` after PR #11 landed during validation, preserving its cooker filters, photo captions and listing updates.

The photographic storefront at `/` offers **Shopping assistant** for the receipt view and **Explore the agent harness** for the separate `/harness` shelf. The harness opens its chat and inherits the active search and filters in browser navigation state. The agent harness lives under `src/lib/harness`; a narrow adapter bridges the existing storefront plan. The original catalog, optimizer, product pages, photos and search previews remain the fact sources.

## Decisions and review

- Accepted: keep the harness in its own namespace. The older personalization API remains in use by other existing components and has an incompatible unfinished contract test.
- Resolved: adaptive grid, list and Top picks now share one card component. Every selected field renders in plan order, including movable images; omitted fields disappear. Names and deal actions remain available. Highlighted specs lead, and vouchers use the shared optimizer and clock. The initial photographic storefront stays intact.
- Resolved: explicit controls cancel pending answers; suggestions synchronize with current controls before acceptance; undo/reset regenerate the change receipt.
- Resolved: section rendering follows validated plan order and always retains products; unavailable sections disappear.
- Resolved: query-scoped specification preferences survive adapter round trips. Validation of the base plan precedes validation of specification fields.
- Resolved: the client retains server guard/drop evidence after revalidating an already-sanitized response.
- Independent review found no remaining blocking async or fact-safety regressions after the above fixes.
- Dependencies: OpenAI supplies the delivered server transport; Zod validates its model response schema. Neither credentials nor transport are bundled into the client.

## Original PR verification

- Production build and Svelte type check passed (zero errors, zero warnings).
- All unit/component tests: 255 passed, one deliberately opt-in live-model test skipped. No model key or paid inference was used.
- All 19 browser tests passed on a local production build. Added coverage for ordered and omitted card fields, highlighted specs, price invariance, Undo, bilingual offline cards, phone overflow and the large-print cooker caption.
- Migrated the five stale contract acceptance tests to the actual harness API. Kept all five behavioral guarantees, strengthened no-op history, language precedence and question-state checks, and documented the superseded API proposal. No production compatibility shim or weakened assertion was added.
- Updated old browser selectors for the new adaptive card and in-place assistant. Production checks exercise both disabled endpoints and safe offline fallback. Restored the active cooker sort heading.
- ESLint passed for every changed TypeScript/Svelte file; diff whitespace checks passed.
- Browser golden evaluation: 59/59 matches, zero fact violations, with original shopper messages unchanged. Regression tests cover the newly understood conversational phrases and prevent questions naming one category from citing a different category.
- Local browser poison test preserved every displayed product price and reported the replaced reply/dropped fields.
- Four themes and Thai/English checked at 390×844 and 1440×900 with no document sideways scroll. Large-print adaptive cards use 20px base text, at least 48px buttons, and a 20px floor for cooker photo captions.
- Independent review covered the migrated tests, parser changes and adaptive card. The category-citation and caption-size findings were fixed and verified.

Local development: `npm run dev -- --host 127.0.0.1 --port 5181`. The assistant defaults to offline. Live calls are opt-in in X-ray; the poisoned-model control is development-only. Both assistant endpoints require local development, a loopback host and peer, and a same-origin JSON POST. Preview and production use the offline path. The provider receives recognized intent and presentation labels and validated catalog context. Messages, past conversation and search prose stay local.

The draft PR is updated for review. No merge or deployment was performed. Live-model accuracy remains unmeasured; the offline golden set is provisional, not a claim about arbitrary shopper language.

Run the offline production suite with `npm run test:e2e`. The development-only mock-model browser check uses `node_modules/.bin/playwright test --config playwright.harness-local.config.ts` and starts its server with provider credentials cleared.
