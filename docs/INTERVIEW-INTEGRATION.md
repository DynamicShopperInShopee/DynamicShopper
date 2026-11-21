# Storefront interview integration

The root storefront offers the optional DynamicShopper interview from PR #14.
The shopper can search, choose a category, or open the interview immediately.
One Apply updates the existing shelf. The receipt URL, listing pages, cart, chat,
comparison views, pricing engine and catalog use the same store session.

The guided conversation and the direct choices run in the browser. The guide
asks the same four authored questions in Thai or English. Shoppers can type or
select a listed reply, skip a question, and review the proposed view before
applying it. Typed replies stay on the device. Only recognized choice IDs reach
the presentation validator.

`InterviewEntry.svelte` opens the bilingual dialog. `InterviewWizard.svelte`
keeps draft answers, supports skipping each question and previews the actual
plan changes. Closing the dialog returns focus to the opener. Apply focuses
the shelf and exposes chat for further changes.

Each recognized answer maps directly to an authored setting. The shopper can choose a goal, evidence, priority and reading style independently. Only large text changes the theme. Skipped or unknown answers preserve the corresponding settings.

Apply records one Undo step when the view changes. Returning from a listing restores the accepted view and its history through an opaque tab-local key. The tests cover every complete or skipped combination, product facts, locale, keyboard focus, cart, capacity, navigation, chat refinement and Undo.

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
Its orange DynamicShopper header and interview flow are the starting experience.
