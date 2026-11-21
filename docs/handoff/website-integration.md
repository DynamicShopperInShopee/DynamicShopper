# Claude harness integrated into the PR #9 storefront

Baseline: merged PR #9, commit `63f9345`. Branch: `codex/website-agent-harness`. Rebased onto `e248361` after PR #11 landed during validation, preserving its cooker filters, photo captions and listing updates.

The photographic storefront at `/` now opens the assistant in place. Claude's delivered harness lives under `src/lib/harness`; a narrow adapter bridges the existing storefront plan. The original catalog, optimizer, product pages, photos and search previews remain the fact sources.

## Decisions and review

- Accepted: keep the harness in its own namespace. The older personalization API remains in use by other existing components and has an incompatible unfinished contract test.
- Accepted: preserve the existing card design and baseline fact fields while enabling harness sections, themes, layouts, filtering, rankings and replies. Full arbitrary card-field ordering remains a presentation follow-up.
- Resolved: explicit controls cancel pending answers; suggestions synchronize with current controls before acceptance; undo/reset regenerate the change receipt.
- Resolved: section rendering follows validated plan order and always retains products; unavailable sections disappear.
- Resolved: query-scoped specification preferences survive adapter round trips. Validation of the base plan precedes validation of specification fields.
- Resolved: the client retains server guard/drop evidence after revalidating an already-sanitized response.
- Independent review found no remaining blocking async or fact-safety regressions after the above fixes.
- Dependencies: OpenAI supplies the delivered server transport; Zod validates its model response schema. Neither credentials nor transport are bundled into the client.

## Local verification

- Production build passed.
- Harness, integration, server-agent and handler tests: 151 passed, one live-model test skipped; seven integration tests include the actual website adapter round trip.
- Full server suite: 233 passed, five failed, one skipped. All five failures are the existing `src/lib/personalization/contract.spec.ts` contract/API mismatch. The same file causes two existing type-check errors (`applyTurn` export and extensionless fixture import). No tests were skipped or weakened to conceal these failures.
- ESLint passed for imported harness/server code and modified UI code.
- Browser at localhost: budget filters produce Aero X, Nova Lite and Vortex W; battery question cites the listing and preserves the list; poisoned response replaces unsafe prose, reports dropped fields and preserves facts.
- Browser golden evaluation: 51 of 59 intent/plan expectations match, zero fact violations. The set is provisional; remaining offline interpretation gaps are retained rather than tuning the messages.
- Four themes checked at 390×844 and 1440×900; Thai and English mobile paths have no document-level sideways scroll. Comparison tables retain their own scroll container.
- Production preview returns 404 for POST `/api/assistant` with the local override unset. No paid model test, merge or deployment performed.

Local development: `npm run dev -- --host 127.0.0.1 --port 5181`. The assistant defaults to offline. Live calls are opt-in in X-ray; the poisoned-model control is development-only.

This is a draft for review. Existing legacy test failures, golden-message gaps and full card-field ordering should be resolved before declaring the entire repository release-ready.
