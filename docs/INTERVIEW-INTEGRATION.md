# Storefront interview integration

The root storefront offers the optional DynamicShopper interview from PR #14.
The shopper can search, choose a category, or open the interview immediately.
Completing or skipping the last question automatically updates the existing shelf. The receipt URL, listing pages, cart, chat,
comparison views, pricing engine and catalog use the same store session.

`InterviewEntry.svelte` opens the bilingual dialog. `InterviewWizard.svelte`
keeps draft answers and supports skipping each question. There is no separate
preview/Apply gate. Closing the dialog returns focus to the opener without applying
a draft. Completion focuses the change receipt and exposes chat for refinement.

The root storefront maps allowlisted answer IDs directly to a validated
presentation. The Conv1d model and its synthetic training labels remain available
for research. The storefront does not run the model.

An effective completion records one Undo step, including previous answers and locks.
Explicit answer settings remain protected from later inference. Completing equivalent
settings keeps the answers without creating locks or consuming Undo. Undo restores
the earlier presentation in browser preferences. Reset restores the store defaults.
Returning from a listing restores the interview and its Undo history through an opaque
tab-local key.

The regression suite exercises every complete or skipped answer combination,
independent rejection of invalid model output, unchanged catalog facts, locale,
focus, cart controls, capacity, navigation, chat, and Undo.

## Integration validation against current main

Status: accepted integration update — sync PR #14 with main `81ec69a`, retaining
its digital-cooker listing, harness acceptance checks and the authored interview
flow. This extends the branch's earlier harness sync at `0202ca4`.

- Keyless Node and Cloudflare builds pass. Wrangler deployment dry-run passes;
  no live deployment is performed.
- Full offline unit/component suite: 364 passed; the opt-in live API test is skipped.
- Full production browser suite: 133 passed; the development-only poison test is
  skipped there and passes in a separate development run.
- Type checking reports zero errors and zero warnings. Scoped integration lint,
  formatting and `git diff --check` pass.
- Checks used the locked dependencies and cached Chromium 1223. Temporary runner
  configs and build artifacts are excluded from the commit.

Status: accepted UI decision — the user selected PR #14's DynamicShopper design.
Its orange DynamicShopper header and interview flow replace the earlier
`codex/cnn-interview-main` branded interface. The integration checks above apply
to the approved design.

## Preset library follow-up

Status: accepted — the latest user instruction replaces the preview/Apply gate with
automatic completion and removes manual theme/persona choosers from the main store.
This follow-up starts from main `084490a`, preserving the merged interview, catalog,
listing media, shared session and development-only agent harness.

`/presets` provides the reference's exact 177 module designs in twelve groups plus
twenty isolated presentation examples. Every entry has bilingual needs, triggers,
anatomy and dependencies. The 73 ready / 104 service split classifies design support;
it does not claim 177 production features. Missing services remain unavailable.
Original photographs and the updated sourced catalog are pending. No database import
or publication is included. See [the full inventory](PRESETS.md).

Validation for this follow-up is recorded separately in its PR; the earlier integration
counts above describe the earlier accepted main tree, not this new change.

Follow-up verification: server tests 313 passed (one opt-in live test skipped);
interview browser tests 16 passed; focused preset, cart, composition, capacity,
Undo and accessibility browser tests 46 passed (development-only poison test skipped
in production). A fresh build after the final density-token adjustment passed both
preset browser tests again. Type checking reports zero errors/warnings; scoped ESLint,
formatting and diff checks pass. Browser inspection also confirmed automatic completion,
receipt focus, Undo, and isolation of library examples on the combined main tree.
