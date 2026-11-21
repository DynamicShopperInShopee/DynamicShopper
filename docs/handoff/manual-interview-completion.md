# Manual interview completion

Baseline: `ff393ba`. Scope: restore the user's accepted automatic completion flow after the merged direct interview reintroduced Preview/Apply. Keep direct answer mapping, existing validation, draft isolation and Undo history. No AI or provider implementation changes.

Finishing or skipping the last question submits the answers once. Earlier steps remain drafts. A completion guard prevents duplicate callbacks. The final question explains automatic application and Undo in Thai and English. The existing store callback validates the proposal, preserves filters and records one history entry only when the view changes.

Verification:

- New browser regression failed before the change because completion still required the old gate.
- Server suite: 359 passed, one opt-in live test skipped.
- Interview browser suite on a credential-cleared development server: 20 passed, including EN/TH, phone/laptop, offline, keyboard, cancellation, no-op history, filters, cart and listing return.
- Production Node build passed before the final copy and unused-style cleanup; no production browser run was performed.
- Scoped ESLint passed. Svelte check used a temporary config with explicit generated-route `rootDirs` because dependencies were linked from another local checkout; no tracked build configuration changed.
- Independent review found no wizard logic blocker. Review findings about old assertions and preview copy were corrected.

Remaining release checks: normal type-check with independent dependency installation, production browser smoke, all four themes and existing provider poison checks. This is one Manual increment, not certification of every storefront journey. No merge, deployment or paid provider call was performed during implementation.
