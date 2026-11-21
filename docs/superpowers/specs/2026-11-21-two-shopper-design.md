# DynamicShopper hackathon design and team workflow

**Status** Proposed for team approval. **Primary build direction** AI-Native Products & Operations.

## What the judges should experience

Two people can start with the same rice cookers and ask different questions. One wants to compare capacity and warranty. The other wants to send their parent an easy-to-read Thai shortlist. Hold the category and query fixed. Keep one identifiable cooker in both views. Let the judge follow that cooker across layouts and read the same catalog price and capacity in either language. Personalization can change which items lead. The comparison checks the intersection of rendered product and field identities.

The team chose this approach because it makes customization and trust observable in one interaction. A pricing-first demo would make the optimizer easier to examine, but leave less time for the shopper to experience the different interfaces. Keep its strongest example as a final receipt. The merchant analytics and coupon-profit work in REPORT.html is proposed research outside this prototype. METHODS.html supplies experiment ideas. Publish only measurements actually collected.

| Six-minute rehearsal | What the audience sees | Evidence to capture |
| --- | --- | --- |
| First minute | Two shoppers describe their needs over the same search | Problem and beneficiary in their own words |
| Minutes two and three | Chat selects a spec table for one shopper and a Thai large-print list for the other. Open What changed, then Undo and reapply. | Visible differences and explicit control. A shared product remains identifiable. |
| Minute four | Compare the panes. Open a cited listing answer. | Nonempty check over rendered values and localized text. Product questions preserve the plan. |
| Minute five | Open the shared product's best deal from both contexts using identical basket, balance and clock. | Matching itemized totals from the same optimizer. |
| Final minute | Force offline, make one more change and show one reviewed Codex change and its test. | A working fallback and a concrete account of Codex's contribution. Keep a local development-only poisoned-response rehearsal for Q&A. |

On desktop, place the preferences above the shop and dock chat to the right. On a phone, keep the product identity and price readable with chat collapsed. Open the comparison and receipt in the existing thermal-receipt visual language. Use category glyphs, four tokenized themes, keyboard controls, no motion under reduced motion, and the Thai and English text floors in [the visual specification](../../../guidelines/DESIGN.md). Run the full [reference journey](../../../guidelines/JOURNEY.md) independently of the shorter presentation.

Rehearse through the existing planned controls. Use chat for the two successive changes in the main store, then open Compare views and pick Tech minimal and Mom mode with the same rice-cooker query. Label those panes as the selected presets. Keep the live chat plan and its undo history in the main store. Use the product page or Best price action for the receipt comparison because the compare panes omit the deal section. Assert that the anchor cooker's price is visible in both panes and that the capacity is available on each listing. Verify the actual anchor price separately from the count of overlapping fields.

## Starting point and first integration

The current root route is a SvelteKit welcome page. The global server hook initializes authentication and a database even for storefront requests. The existing unit and browser examples exercise the starter. The first integrated milestone is a working root route with a few bilingual catalog entries, offline personalization and a real fact check in both views, booted without database setup or an AI key. Keep SvelteKit, Bun, Vitest and Playwright. Give one owner responsibility for the shared runtime. Preserve existing demo callers when isolating them from storefront startup.

Agree on the following contracts in one small reviewed baseline before opening dependent feature PRs. A real, catalog-backed bilingual sample, a shopper request, a rejected field and an expected receipt travel with the contracts so all four people can work against the same examples.

| Producer | Shared contract | Acceptance at the consumer |
| --- | --- | --- |
| Catalog | Stable product and field identity, typed raw value, units, canonical bilingual formatter, voucher and shop identities | A rendered element exposes its identity and value. The verifier resolves the source independently and checks both raw value and visible text. |
| Pricing | Basket of catalog IDs and quantities, reference clock, single simulated coin balance → applied and unused vouchers, reasons, exact whole-baht line items, total and savings | Card, chat and section give identical receipts for identical inputs. Test a case where the locally largest voucher loses. |
| Personalization | Validated partial plan, explicit filter clearing, control precedence, one undo record per effective change, deterministic order and contributing terms | A mixed-validity proposal preserves its valid fields. A direct language choice survives inference. Aero X leads the documented under-budget mouse case. |
| Conversation | Intent-specific result for change, question, deal and control actions. Price-free model projection and read-only listing references. Local templates and safe trace fields | Both backends use the same validator and reply guard. Questions cite a read listing or decline. Deal requests preserve ranking. The store performs Reset and Undo. |

Treat shopper-entered amounts separately from model output. Parse budget constraints locally before composing model inputs, including history, saved plan and tool echoes. Keep numeric budget and ranking computation on the deterministic side. Allowlist trace fields and format dropped-field diagnostics locally so arbitrary model strings cannot become shopper copy or logs. An outbound-request test should inspect the entire serialized model request using synthetic sentinel prices. The public build must run with the model endpoint unavailable and expose no private configuration. Test malformed links, saved state and development flags through the same public entry points used in normal operation.

## Four owners and one integration path

| Owner / branch | Owns changes | Consumer and evidence |
| --- | --- | --- |
| 1 · `feat/catalog-pricing` | Catalog, fact resolution and formatting, pure optimizer, voucher fixtures and domain tests | Owners 2 and 3 import these interfaces. Check catalog integrity, expiry, floors, caps, tie breaks, unused reasons and cross-surface parity. |
| 2 · `feat/personalization` | Plan and ranking engine, offline parser, local model adapter, bounded tools, reply guard and engine tests | Owner 3 consumes intent, plan diff, citations and explanation terms. Verify fallback on timeout, field-wise rejection, price-free requests, guarded replies and inert questions. |
| 3 · `feat/storefront-proof` | Storefront routes and components, visual tokens, UI copy, interaction state, compare panes and DOM verifier | Owner 4 runs the journey against real controls. Test wrong printed text with correct metadata, wrong raw value, empty overlap, Undo, focus and mobile overflow. |
| 4 · `feat/integration-release` | Runtime isolation, shared config, integration fixtures, end-to-end checks, release evidence, submission and shared documentation | All owners can start the app offline. Review the public artifact in a fresh browser. Record actual check results and remaining limitations. |

### How a change moves from idea to main

1. **Define the change.** Owner 4 assembles the baseline on the integration branch with example inputs from owners 1 and 2 and rendering feedback from owner 3. Record the reviewed merge SHA in each assignment. Write the shopper-visible outcome and one observable acceptance example in the owner's Markdown assignment. State owned paths, upstream contract version or baseline SHA, downstream consumer, verification command and expected output. Link the relevant guideline once. Keep future ideas under proposed, accepted or dropped with a reason.
2. **Branch and build.** Each person branches from the reviewed baseline in their own checkout of this repo. Commit small coherent changes and push each completed increment to their own branch. Use a draft PR while integrating. Scope a Sol coding agent to the owner's paths and acceptance example. Use Astra for cross-owner decisions and ambiguous failures. A handoff needs the base SHA, changed paths, test command and result, and open issue. Use the diff and a short failure excerpt for follow-ups.
3. **Handle interface changes at the producer.** Describe the changed field and consumer impact on the producer PR. The affected consumer reviews the fixture. Land a backward-compatible contract first when possible, then migrate consumers. The integration owner serializes changes to shared config, the lockfile and root AGENTS.md. Feature owners propose rule changes in their PR. A behavior change and its matching guideline update land together.
4. **Review on the combined tree.** A teammate other than the author reviews each change. Owners 1 and 2 cross-review domain boundaries. Owners 3 and 4 cross-review rendering and integration. For shared API changes include the consuming owner. Sync the feature branch with current main before merge. The owner resolves conflicts with the other author using the agreed behavior and fixtures, then reruns both affected suites. Regenerate a conflicted lockfile from the reviewed manifest with the project's Bun version. Push the resolution to the same branch. One approved PR at a time lands on main.
5. **Prove the result.** Start a bug fix with a failing reproduction. Run the narrow test while coding. On the merged candidate run type checks, lint, unit tests, production build and browser journey. Provision dependencies and Playwright browsers before the offline rehearsal. Use the installed Playwright binary directly during rehearsal since the starter e2e script invokes browser installation. Verify 1440×900 and 390×844, four themes and both languages. Confirm 20px text and 48px targets in large print, accessible contrast and keyboard focus. Revert a regression via a reviewed revert commit if a fix would hold up everyone.
6. **Keep the release demonstrable.** Merge the contract and keyless boot first. Then integrate domain, conversation and UI increments as their acceptance examples pass. Once the first comparison works on main, repeat it after each merge. Keep a known-good commit and its evidence for rehearsal. Stage the release with time to test the public URL signed out before 17:00 Bangkok. Prioritize proof, accessibility and the offline path before expanding the demo. Record incomplete journey steps explicitly.

Owner 4 curates golden messages with expected intent and behavior independently of the parser. Owner 2 runs them through the real pipeline and records the backend actually used. Owner 3 renders measured results in the Accuracy slip and an unavailable state for an unmeasured model. For X-ray, the proposed change to the trust guideline is to show a sanitized structured summary of instructions and output. Owner 2 supplies the projection, owner 3 renders it, and owner 4 reconciles the trust guideline in the same implementation PR. Test that unknown input keys, price-bearing replies and server configuration never appear in the public trace.

### Repo boundary and release evidence

After the hackathon, keep ownership of the domain with the team member who knows it and open a fresh, short-lived branch for each subsequent change. Start from current main after the previous PR merges. When a bug crosses domains, give one person the failing user journey and let each affected owner review the fix. Update the existing acceptance example and guideline as part of that change. This gives the next developer a reproducible case without having to reconstruct a chat session.

Give agents this repo as their only project workspace. Keep other repos, personal account data, credential stores and external document connectors outside the task. Keep secrets in local private configuration. Commit named files after inspecting the staged diff. Use synthetic data for test transcripts, X-ray examples and screenshots. Share only reviewed code changes with this repository's configured remote. Keep the organizer PDF local.

| Judging criterion | Evidence the release owner gathers |
| --- | --- |
| Problem and solution fit | Same rice-cooker task, two stated shopper needs, and the visible response to each |
| Build quality | Reproducible keyless startup, real fact verification, accessibility and failure-path test results |
| Insight and originality | A shared product highlighted across two layouts, with its facts checked on screen |
| Real-world value | A family member can read the shortlist and inspect an exact total. Label any unmeasured benefit as a hypothesis. |
| Alignment with build direction | Show how natural-language preferences change which decision aids the storefront presents |
| Use of Codex | One traceable example from requirement through agent-produced diff, human review and passing verification |

Submit one Google Form by **17:00 Bangkok, 21 November 2026** with the public GitHub repository, project writeup, working demo/prototype link and declarations. Both rounds allow six minutes to demonstrate. Prepare for two minutes of questions in round one and four in the final. The team confirms this is a new, currently private repository and reports no reused open-source project as a base. List the actual framework and package dependencies separately. Identify the starter/docs baseline and what the team built on-site from its commits and firsthand record. The repository owner will make it public before submission. Verify anonymous access to both links after that change. No deployment or visibility change is part of this design review.

The four implementation briefs will expand the ownership table into ordered tasks with file boundaries, tests, review checkpoints and a copyable agent handoff after the team approves this design.
