# Storefront interview integration

The root storefront offers the optional DynamicShopper interview from PR #14.
The shopper can search, choose a category, or open the interview immediately.
One Apply updates the existing shelf. The receipt URL, listing pages, cart, chat,
comparison views, pricing engine and catalog use the same store session.

`InterviewEntry.svelte` opens the bilingual dialog. `InterviewWizard.svelte`
keeps draft answers, supports skipping each question and previews the actual
plan changes. Closing the dialog returns focus to the opener. Apply focuses
the shelf and exposes chat for further changes.

The bundled Conv1d model receives four allowlisted answer IDs. It can suggest
presentation fields from the fixed library. Prior explicit settings protect
their fields from inference. Missing answers and model failure use direct
mappings. The direct-only switch bypasses inference. The synthetic training
labels have not been evaluated against real shopper preferences.

An effective Apply records one Undo step, including previous answers and locks.
Answer-sourced fields remain protected from later inference. CNN-suggested
fields can be refined in chat. Applying equivalent settings preserves the
direct-only choice without creating locks or consuming Undo. Undo restores
the earlier presentation in browser preferences. Reset restores the store
defaults. Returning from a listing restores the interview and its Undo history
through an opaque tab-local key.

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

Status: proposed UI decision — this branch replaces the previously selected
`codex/cnn-interview-main` branded header and interview UI. The PR remains draft
until that choice is reconciled; synchronization does not approve that design change.
