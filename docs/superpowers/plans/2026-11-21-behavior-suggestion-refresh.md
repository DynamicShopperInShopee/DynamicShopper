# Refresh behavior suggestions before applying

**Goal:** Keep a previously displayed behavior suggestion from overriding a newer explicit preference or restoring stale card fields.

**Scope:** First bounded Gap 1 increment, authorized to proceed incrementally. This does not implement the customer profile or claim Gap 1 complete. Interview stays; CNN removal already exists in PR #22 according to the team's report and is excluded here.

**Design:** Re-derive suggestions from the current plan, signals, dismissed kinds and explicit locks at acceptance. Only an already offered suggestion may be accepted. If it is no longer eligible, refresh suggestions without changing the plan or Undo history. Otherwise apply its current patch as the shopper's explicit, undoable choice. Reusing a cached patch was rejected because its fields can become stale. Global state lifecycle redesign is deferred.

**Files:** `src/lib/harness/signals.ts`, `signals.spec.ts`, `guidelines/PERSONALIZATION.md`.

**Constraints:** No catalog, pricing, UI styling, interview, provider, or Python changes. Existing offline behavior and field-by-field validation remain intact.

## Steps

- [x] Add regressions for a newer explicit layout, changed card fields and an already satisfied suggestion; observed all three fail before the fix.
- [x] Refresh at acceptance and run the affected harness suite.
- [x] Update the behavior guideline; independent review found no important problems.
- [x] Record checks and remaining integration work before handing off.

## Review focus

An expired or dismissed suggestion cannot apply. A valid acceptance remains one Undo step. A refresh cannot silently alter the plan. Evidence threshold and explicit preferences remain authoritative. No new model call is introduced.

## Checkpoint — 21 November 2026

Baseline: `a3fdf65`. Server tests: 331 passed, one opt-in live test skipped. The harness/agent subset passed 168 tests. Changed TypeScript files pass ESLint and formatting checks.

The standard type-check command initially reported 53 errors around route `$types` resolution while using dependencies linked from another local checkout. A temporary config pointing `rootDirs` at this worktree's `src` and generated route types passed with zero errors and warnings. No tracked configuration was changed. The ordinary check should be repeated with an independent dependency installation before merge.

Pending: browser integration, normal production build, all-theme/locale viewport checks and poisoned-model browser checks. No deployment or live provider call was performed. This checkpoint is a tested engine fix, not completion of the customer-profile pipeline or Gap 1.

Next increment: connect a real additional behavior event to the engine and preserve explicit choices. Evaluate a session profile separately. Keep the optional interview and direct controls; avoid making interview completion a requirement for personalization. The UI choice is a proposal, not an implemented change.

Team report correction: CNN removal is already pushed in PR #22 according to the third teammate. Do not duplicate that work. Main at this baseline still contains CNN and now applies interview answers on completion; the older Preview/Apply description is historical.
