# Interview integration with main

Status: accepted for the root storefront; production effectiveness of the model is unmeasured.

Baseline: `origin/main` at `e248361`. The user requested a PR for the integration
owner while another chat owns the default Shopee-style surface. This change
ports the existing interview work into main's catalog, validator, ranking and
undo history. It does not replace the root with the separate sourced-shop demo
or import that demo's seven listings or its component-preview workspace.

## Integration seam

`PersonalizeShop.svelte` owns the optional dialog and its saved answers.
`InterviewForm.svelte` owns draft steps and the proposed change receipt.
`interview.ts` accepts only the four allowlisted answer IDs and uses the existing
`validateProposal` boundary. Apply calls the root's existing `changePlan` once.
Drafts never mutate the page; closing discards them. No-op Apply creates no new
undo entry or new locks. Answer-sourced fields lock against later inference;
CNN-sourced fields remain refinable. The prior locks are part of the same undo snapshot.
The existing chat, change chips, Undo, Reset, product links, facts and optimizer
continue to use main's state and catalog.

The root's `eventDemo` is its current marketplace/search renderer. It remains
the initial renderer. After an effective Apply, the existing adaptive renderer
shows the selected layout and chat. Undo to an unadapted root restores the
marketplace. An explicit `view=receipt` URL remains supported. The default-page
owner can move the single `PersonalizeShop` mount without changing its contract.

## Model scope

The bundled weights were ported from the interview experiment already prepared
in the local workspace. They are a small trained Conv1d model, evaluated in
JavaScript with no extra dependency or network. Its input is answer IDs only;
it receives no catalog, prices or user text. Complete answers propose layout,
information and sections; reading and priority choices are protected. Existing
theme locks win. Skipped answers, invalid heads and runtime failure retain the
direct-answer path. The optional disclosure includes a direct-only switch.

The training labels are authored examples, not observations from real shoppers.
No claim of increased conversion, time spent or predictive accuracy on people
is made. METHODS.html's baseline/contrast method and REPORT.html's explicit
controls motivate comparing this flow against the unchanged default. Completion,
feature discovery, decision time, Undo rate and satisfaction require a later
measured study; the number of possible layouts is not evidence of improvement.

## Handoff

- Keep the default storefront work in its owner's PR.
- No catalog schema, pricing, dependency, runtime or deployment change is required.
- The 144 component arrangements remain in the earlier design workspace; they
  are not represented as completed product features in this integration.
- Review the root import/mount and `eventDemo` condition when combining the PRs.
- Main currently contains an older `contract.spec.ts` expecting an unexported
  `applyTurn` and a different shared fixture contract. Track that upstream
  failure separately; this PR does not replace the shared state contract.
