# DynamicShopper: Generative UI UX and UI Development Report

**Date:** 21 November 2026  
**Status:** Proposed — research-informed direction for validation, not an approved change to product requirements.  
**Scope:** Customer needs, shopping journeys, interface behavior, development priorities, and evaluation.

## Executive recommendation

Develop DynamicShopper as a shopping workspace organized around **finding, comparing, and verifying**. Adapt the information and decision aids to the shopper's current task while keeping navigation, explicit controls, product identity, and facts predictable.

The intended benefit is less work translating a need into search terms, remembering differences across listings, checking evidence, and calculating the payable total. These benefits remain hypotheses until measured in DynamicShopper.

The existing product boundary remains central: the AI proposes validated plan changes; catalog and pricing logic supply facts; deterministic logic orders products. Questions preserve the store, and deal requests preserve ranking.

## 1. Research findings and their implications

| Finding | Evidence and limitation | Development implication |
| --- | --- | --- |
| Shoppers can struggle to articulate their needs to AI | Adobe's June 2026 survey of over 1,000 US shoppers reports that nearly one in five abandoned an AI shopping request because they did not know how to ask for what they wanted. This is vendor-sponsored, self-reported US research. | Provide starting actions, guided choices, and editable interpretations alongside conversation. |
| Product searches express situations as well as product names | Baymard documents use-case, feature, symptom, and compatibility searches. Its 2026 benchmark reports inadequate search support at 56% of sites. | Support reviewed mappings from everyday vocabulary to catalog-backed filters and priorities. |
| Adaptive interfaces have promising usability evidence | A Google Research banking-prototype study with 72 participants reports System Usability Scale scores of 84.38 for its adaptive interface and 53.96 for its baseline. This does not establish a shopping productivity gain. | Test adaptive decision aids against the existing storefront on equivalent shopping tasks. |
| Continuous refinement and history can support evolving tasks | The CHI 2025 Jelly study reports perceived benefits from structured information, iterative customization, and traceable history. Its eight participants were daily AI users recruited within a university. | Preserve relevant choices across refinements and retain visible change explanations and Undo. |

Sources: [Adobe shopping research](https://business.adobe.com/blog/the-ai-shopping-gap), [Baymard search research](https://baymard.com/research-articles/ecommerce-search-query-types), [Google adaptive-interface research](https://research.google/pubs/self-evolving-systems-moving-beyond-deterministic-interfaces-to-adaptive-generative-interfaces/), and [Jelly, CHI 2025](https://arxiv.org/html/2503.04084v1).

These sources support investigation. They do not validate the proposed personas, establish demand for DynamicShopper, or justify claiming measured productivity improvements.

## 2. Customer hypotheses

Define personas by the task someone is performing. Treat language, readability, visual density, and expertise as independently adjustable needs. One person can occupy several of these situations during a session.

| Proposed persona | Customer need | Useful UX/UI response | Benefit to test |
| --- | --- | --- | --- |
| Deliberate comparer | Resolve trade-offs between known options | Relevant comparison fields, visible priorities, retained candidates, nearby evidence | Less time reconstructing differences across listings |
| Unfamiliar-category buyer | Learn what to inspect before choosing | Brief guided refinement and progressive disclosure of catalog-backed information | More successful shortlisting with less terminology knowledge |
| Constraint-led shopper | Satisfy requirements before considering preferences | Separate eligibility requirements from ranking preferences; expose unknown information | Fewer selections that violate a stated requirement |
| Person buying for someone else | Communicate a decision to a recipient with different needs | Independent recipient criteria, presentation settings, and a readable shared view | Less work explaining and recreating the decision |
| Budget optimizer | Understand the actual applicable total | Itemized optimizer receipt and voucher exclusions | More accurate cost comparison with less manual arithmetic |
| Shopper needing an accessible view | Complete the task with suitable text, controls, language, and navigation | Independent readability controls and accessible interactions throughout | Higher completion with less assistance |

Prioritize the deliberate comparer and unfamiliar-category buyer for the first evaluation. They create distinct information needs over the same catalog without requiring a broader product scope.

## 3. Core shopping journeys

### Journey A: Discover and refine

1. The shopper describes an activity or need, or chooses **Help me choose**.
2. The store shows supported results and exposes its interpretation as editable criteria.
3. A brief clarification appears when an unresolved choice materially affects eligibility or usefulness.
4. The shopper changes a criterion directly or refines it through conversation.
5. Relevant fields and fixed-library sections lead the page.
6. Every effective plan change is explained and can be undone.

Results remain available throughout. Clarification is progressive rather than a compulsory onboarding questionnaire.

### Journey B: Compare and verify

1. The shopper explicitly selects candidates from results or listings.
2. A comparison selection area keeps those candidates accessible.
3. The comparison emphasizes fields relevant to the active criteria.
4. The shopper inspects catalog values and attributed review excerpts.
5. A product question opens valid listing citations or an honest refusal without changing the store.
6. The shopper opens a deal receipt for a chosen candidate without changing ranking.

### Journey C: Find an exact item

1. The shopper searches a known name or model.
2. Direct results lead to the listing.
3. Comparison, evidence, and pricing tools remain available when needed.

This journey establishes a useful baseline: adaptation must earn its interaction cost on straightforward tasks.

### Journey D: Prepare a view for another person

1. The shopper specifies relevant recipient needs.
2. Language, readability, and shortlist presentation are selected independently.
3. The shopper inspects the resulting view before sharing.
4. The recipient can inspect the same catalog facts and adjust the presentation.

Current sharing carries the presentation plan. Sharing explicitly selected candidates or decision criteria is a separate proposed contract extension; the interface must describe what is actually included.

## 4. Screen and component requirements

### Entry and search

Keep the standard store visible on arrival. Offer task-oriented starting actions:

- **Help me choose:** open a brief guided refinement for the active category.
- **Compare products:** enable explicit candidate selection.
- **Calculate the deal:** use a chosen product, current focus, or basket; ask for a target when none exists.

Keep exact-item search direct. Preserve the query during refinement. Suggestions should use reviewed UI copy and supported catalog vocabulary.

### Criteria area

Place the current interpretation between navigation and results. Separate it into:

| Group | Function | Examples |
| --- | --- | --- |
| Requirements | Determine eligibility | Category, budget, supported compatibility conditions |
| Preferences | Determine deterministic ranking | Battery higher, weight lower, durability first |
| View | Determine presentation | Comparison table, large print, language |

Each criterion opens an ordinary editing control and can be removed individually. Inferred changes appear in the existing change receipt. Directly chosen settings retain precedence over inference.

Budget input is parsed and handled locally. Its raw amount must not enter model instructions, context, history, or tool output.

Baymard's applied-filter research reports disorientation and additional refinement effort when selected filters are not visible. This supports retaining an explicit overview. [Applied-filter research](https://baymard.com/research-articles/how-to-design-applied-filters)

### Product results

Use the existing grid, list, and table as reviewed representations of the same catalog. Adapt visible fields and section order to the task. Keep product names and identity recognizable across representations.

Provide a clear way to select a product for comparison. Display relevant evidence near the product where available. Avoid unsupported suitability labels, inferred compatibility, generated review summaries, and fabricated recommendation scores.

### Product comparison

Distinguish **Compare products**, a shopping tool, from **Compare views**, the existing factual-consistency demonstration.

- Keep candidate selection under shopper control.
- Preserve selected candidates when presentation changes.
- Let shoppers choose comparison fields.
- Keep the original product list reachable.
- Label missing information as unavailable in the listing.
- Identify when a later filter excludes a selected candidate; provide an explicit remove action without presenting it as eligible.

On phones, prefer stacked comparisons with consistent field labels. Contain any necessary table scrolling inside its own component.

### Product details and evidence

Bring fields relevant to the shopper's criteria forward, with remaining information available through progressive disclosure. Render facts through the canonical fact components and formatters.

Questions must cite an available listing reference or decline to confirm. A cited review remains an attributed buyer statement. It does not become a verified product specification.

Requirement status can indicate **satisfied**, **not satisfied**, or **cannot confirm** only when the supporting data and deterministic check exist. Green verification marks require an actual successful check.

### Deal receipt

Reuse the single optimizer and existing receipt treatment. Show catalog line items, shipping, applicable vouchers and coins, the exact total, and reasons other vouchers were unused.

Opening or closing a receipt preserves search, ranking, presentation, and candidate selection. Add-on suggestions remain subject to the existing optimizer and display rules.

### Readability and recipient settings

Separate language, text size, density, focused-shortlist presentation, and recipient needs. Avoid inferring accessibility requirements or language solely from age or family relationship.

Google's adaptive-accessibility research emphasizes individual needs and co-design with disability communities. It supports involving those users in evaluation, rather than assuming a preset covers their requirements. [Accessibility research](https://research.google/blog/how-ai-agents-can-redefine-universal-design-to-increase-accessibility/)

## 5. Stable interface and responsive behavior

Keep search, navigation, criteria, Undo, and Reset in predictable positions. Adapt the product representation, field emphasis, and fixed-library section order inside that structure.

| Surface | Desktop behavior | Phone behavior |
| --- | --- | --- |
| Assistant | Docked beside the product workspace | Collapsible bottom sheet; results remain usable when closed |
| Criteria | Visible above results | Wrap without sideways page scrolling |
| Comparison selection | Compact area near the product workspace | Reachable without covering product content or assistant controls |
| Evidence and pricing | Open near the current decision | Accessible sheet or inline receipt with reliable focus return |
| Change explanation | Receipt associated with the applied change | Visible after the assistant closes, without losing the shopper's place |

Use the existing thermal-receipt language: paper surfaces, ink, seams, and receipt slips. Preserve all four themes, Thai and English, keyboard navigation, reduced motion, and the large-print floors. Every new control and state needs reviewed bilingual copy.

## 6. Required states and recovery

| State | Required behavior |
| --- | --- |
| First visit | Standard results and task actions; no required persona selection |
| Ambiguous request | Preserve usable results and offer a useful clarification |
| Unsupported requirement | Explain what cannot be confirmed; do not imply eligibility |
| No matches | Show restrictive criteria and individual recovery actions; never silently relax requirements |
| Waiting | Preserve the current workspace and prevent conflicting submissions |
| Invalid model output | Retain valid proposal parts and use the existing guarded response behavior |
| Offline or timeout | Continue through the fallback and explicit controls |
| Product question | Show citations or refusal while preserving the plan |
| Deal request | Open optimizer output while preserving ranking |
| Returning session | Explain restored settings and allow reversal |
| Shared view | Validate untrusted state, explain what opened, and allow Undo |

## 7. Development implications

### Reuse existing foundations

The repository already contains useful foundations: the validated shopper plan, deterministic ranking, offline parser, field formatting, fact verification, table presentation, assistant input, and deal receipts. Extend these through focused changes rather than introducing a separate personalization system.

### Proposed components and state boundaries

| Proposed responsibility | Suggested boundary |
| --- | --- |
| Task-oriented entry actions | Dedicated component with reviewed local copy |
| Criteria overview and editing | Separate group and editor components; shared validated shopping state |
| Guided refinement | Dedicated form component with local draft state |
| Candidate selection | Shopper-owned state, separate from model ranking authority |
| Product comparison and field controls | Focused components consuming canonical catalog data |
| Evidence display | Existing citation and fact components, extended only where needed |
| Deal display | Existing optimizer and receipt components |
| Shared shopping state | A scoped `context.svelte.ts` using `createContext` |

Keep `+page.svelte` responsible for composition. Encapsulate form drafts, validation feedback, and sheet behavior in their relevant components. Route-only helpers stay colocated; server-only helpers remain under the server boundary.

### Contract extensions requiring explicit design

- Requirements beyond existing filters need typed, allowlisted criteria and deterministic evaluation.
- Compatibility requires authoritative catalog relationships or documented rules backed by sufficient catalog fields.
- Use-case mappings require reviewed catalog tags or deterministic rules; the AI cannot create product facts.
- Candidate persistence needs validated product identities and defined behavior when filters change.
- Sharing a decision shortlist needs an intentional extension beyond the appearance-only share contract.

Producer and affected consumer agreement, examples, acceptance checks, and matching guideline edits belong with each shared-contract change.

## 8. Prioritized proposal register

All items below are **proposed**, not accepted product changes.

| Priority | Proposal | Reason | Acceptance example |
| --- | --- | --- | --- |
| First | Task entry and editable criteria | Reduces dependence on prompt-writing ability | A shopper starts with an everyday need and corrects one interpretation without retyping it |
| First | Independent presentation controls | Separates recipient needs from language and accessibility assumptions | Large print changes without changing language or product criteria |
| Next | Shopper-selected comparison | Reduces repeated navigation and memory work | Selected candidates persist across grid and table presentations |
| Next | Contextual evidence | Makes decisions checkable where they happen | A product question displays a valid citation or refusal and preserves the plan |
| Later | Additional requirement types | Improves eligibility checking when catalog coverage permits | A supported condition is checked deterministically; missing data remains unknown |
| Later | Shared decision shortlist | Supports collaboration beyond shared appearance | The recipient receives only the explicitly documented, validated shared state |

## 9. Risks and decisions

| Concern | Proposed decision |
| --- | --- |
| Layout changes create disorientation | Keep the shell stable, explain effective changes, and preserve Undo |
| Guided refinement becomes an obstacle | Make it optional and progressive; keep direct search available |
| Requirements are mistaken for preferences | Separate their editing and their effects on eligibility and ranking |
| Natural-language mapping invents suitability | Require reviewed catalog mappings or deterministic rules; otherwise disclose uncertainty |
| Comparison and assistant controls obscure products on phones | Coordinate sheets and selection controls; verify at the required phone size |
| Accessibility settings stereotype users | Keep controls independent and evaluate with affected users |
| New selection state conflicts with filters | Preserve the choice but identify exclusion; do not present excluded products as matching |
| Productivity claims exceed available evidence | Report measured task outcomes and label unmeasured benefits as hypotheses |

## 10. Evaluation and acceptance

Compare equivalent tasks using the conventional storefront, storefront with chat, and adaptive storefront. Counterbalance presentation order to reduce learning effects. Include unfamiliar-category shoppers and people using relevant accessibility settings, rather than recruiting only experienced AI users.

Measure:

- Time to a suitable shortlist, including model waiting time.
- Whether selected products satisfy every stated hard requirement.
- Accuracy when explaining differences between candidates.
- Correction effort after a misunderstood request.
- Ability to locate evidence and resume the decision later.
- Perceived effort and confidence, interpreted alongside correctness.

Automated acceptance checks should cover the product boundaries as well as the new interactions:

- Every rendered fact and its visible formatting resolve to authoritative catalog or optimizer output.
- Questions preserve the plan; deal requests preserve ranking.
- Explicit controls survive subsequent inference.
- Candidate selection survives presentation changes and handles excluded products honestly.
- Partial validation preserves valid fields; the reply guard fails closed.
- Outbound model requests contain no prices, including history and tool echoes.
- Undo and Reset restore the documented state.
- Timeout, unavailable model, and forced offline retain usable equivalent controls.
- Thai and English, all themes, keyboard focus, reduced motion, and the required laptop and phone sizes work.

Before release, update the relevant product, personalization, experience, design, and journey guidelines with any accepted behavior change. Complete the core journey on the combined implementation tree and record actual results.

## 11. Public-web discoverability

For a future production catalog, retain stable, crawlable product and category pages with useful textual information before personalization. Adapt the workspace after arrival while preserving page and product identity.

Google states that ordinary SEO fundamentals remain relevant to AI Overviews and AI Mode, with no special AI schema or AI text file required. Structured data should match visible content. [Google Search guidance](https://developers.google.com/search/docs/appearance/ai-features)

Server-rendered product information is a reasonable production choice: Google warns that dynamically generated product markup can make shopping crawls less frequent and reliable. The prototype's simulated catalog must remain clearly identified and must not be presented as genuine merchant offers. [Product markup guidance](https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript)

## 12. Recommended first increment

Build task entry, independently editable presentation settings, and the criteria overview first. Reuse the current validation, ranking, change explanation, and Undo path.

Its acceptance journey is a shopper describing a need, inspecting the interpretation, correcting a criterion directly, changing presentation independently, and undoing the change. Run it in both languages and offline before adding new requirement types or sharing contracts.
