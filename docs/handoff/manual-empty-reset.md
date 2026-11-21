# Empty-state reset and Undo

Baseline: `4d2731a`. Independent Manual increment. User instruction: leave all work
on separate PRs without merging or deploying.

Expected behavior: the search-back and empty-state reset share one handler. When
they clear an applied query, category, sort, budget, shipping or cooker capacity,
record the complete pre-reset shelf once. Undo restores it. Reset with only an
unsubmitted search/filter draft creates no checkpoint.

Scope: keep this handler's existing search/filter reset semantics; do not replace
it with the broader presentation reset or change AI behavior. Record before any
mutations. The existing clear helper on this baseline does not record history.

Plan: reproduce the missing checkpoint in the browser, fix the handler, verify
restoration and a no-op reset, run affected checks, obtain review and open a draft.

Implemented: reset now records the applied shelf before clearing any field. Its
guard excludes draft-only changes and default values. No other reset semantics
or AI integration were changed.

Verification: the original browser regression failed because Undo lost shipping.
The final Node production build passed, followed by 3 production browser cases:
empty-state restoration, default no-op, and unsubmitted-draft no-op. Full server
suite: 365 passed, one opt-in live skipped. Scoped ESLint, formatting, diff checks
and generated-route-aware type check passed with zero errors/warnings. Independent
review found no blockers; its suggested draft-only coverage was added.

Integration note: PR #33 makes `clearFilters` record its own checkpoint and changes
this reset caller to `clearFilters(false)`. Preserve that call when combining the
two PRs so this handler records exactly one checkpoint. This PR is independently
correct on its baseline, where `clearFilters()` does not record history.

No merge, deploy, live provider call or hosted smoke check was performed. The broad
all-theme/locale matrix was not repeated for this checkpoint-only logic change.
