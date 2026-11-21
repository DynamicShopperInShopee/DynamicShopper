# Manual filter removal and Undo

Baseline: `6775f46`. Independent Manual increment; do not merge or deploy.

Expected behavior: clearing applied filters or removing a shipping/budget chip records one checkpoint before the change. Undo restores the applied filters. Clearing when no filter is active creates no history entry. Draft-only values are discarded without adding Undo history.

Keep the existing reset handler's history policy separate so calling the clear helper from reset does not create a partial checkpoint. No pricing, AI or filter-matching changes are included.

Implemented: clear records a checkpoint only for applied filters; budget removal
records before mutation; shipping removal reuses the guarded update helper. The
reset caller disables the helper's checkpoint to avoid partial reset history.

Evidence: both shipping regressions failed at Undo before implementation. All three
browser cases now pass (Clear twice then Undo, remove shipping then Undo, remove
budget then Undo). The full server suite passes 360 tests with one opt-in live
test skipped. Scoped ESLint, generated-route-aware type check (zero errors and
warnings), formatting and diff checks pass. Independent review found no blockers.

These are credential-cleared development checks. Production/browser matrix and
hosted smoke checks remain pending on this branch. No provider calls, merge or
deployment were performed. Independent from PR #29 and #31.
