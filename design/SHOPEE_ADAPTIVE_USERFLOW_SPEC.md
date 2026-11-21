# Owner 2 personalization and agent UX contract

Status: supporting design draft

Primary implementation source:
`docs/superpowers/plans/02-personalization-and-agent.md` on current main.

This document is not a replacement for the Owner 2 implementation plan. It
defines the shopper-visible contract that the pure personalization engine and
bounded development agent must support for Owner 3's storefront.

## Primary Figma board

`adaptive-v5-owner2-contract-rehearsal.svg` is the review board. It supersedes the
earlier onboarding and long-term-learning concepts.

The board rehearses one focused sequence. It is not runtime acceptance evidence:

1. Two shoppers begin with the same rice-cooker query and catalog.
2. Shopper A requests capacity and warranty comparison.
3. Shopper B requests a readable Thai shortlist for their mother.
4. The current integrated anchor product `cooker-1` remains identifiable in both views.
5. Price, capacity, warranty, and shipping are labeled as catalog-owned fixture values.
6. A listing question returns a citation and leaves the store unchanged.
7. A deal request uses the shared optimizer and leaves ranking unchanged.
8. Offline and poisoned-model paths preserve a usable, fact-safe store.

The other five v2 boards remain exploration material for Owner 3. They are not
the Owner 2 acceptance contract.

## Engine boundary

Owner 2 publishes synchronous, pure entry points:

```ts
rankProducts(products: readonly Product[], plan: Plan): RankedProduct[]
interpretOffline(message: string, state: StoreState): Turn
applyTurn(state: StoreState, turn: Turn): StoreState
```

The UI consumes results. It does not reproduce validation, ranking, citation,
reply-guard, or undo logic.

### Change turn

- Carries a validated partial presentation patch.
- Valid siblings survive invalid siblings.
- Creates one undo snapshot only when the state effectively changes.
- Direct controls and explicit field choices beat inference.
- The safe reply contains no product fact.

### Ask turn

- Carries only listing references read during the current turn.
- Never carries a store patch.
- Leaves plan, rank, explicit choices, and undo history unchanged.
- Declines when no valid citation exists.

### Deal turn

- Carries catalog product references, never prices or arithmetic.
- Resolves named product IDs, then focus, then cart, otherwise requests a selection.
- Leaves presentation and ranking unchanged.
- Owner 1's optimizer owns every receipt line and total.

### Undo and Reset

- They are store commands, not model-proposed patches.
- A no-op creates no history.
- Undo restores the previous plan and explicit choices.
- Reset changes only presentation state.

## Two-shopper acceptance case

Both panes hold category and query constant. The same current integrated anchor
fixture appears in both panes:

| Field | English | Thai |
| --- | --- | --- |
| Product ID | `cooker-1` | `cooker-1` |
| Name | 1.8L one-button electric rice cooker | หม้อหุงข้าวไฟฟ้าปุ่มเดียว 1.8 ลิตร |
| Price | ฿690 | 690 บาท |
| Capacity | 1.8 L | 1.8 ลิตร |
| Warranty | 2 yr | 2 ปี |
| Shipping | ฿50 | 50 บาท |

The fact-check design lists product identity, field identity, raw value, and
rendered text as required runtime inputs. The static board carries no green
verification stamp. A green stamp may appear in the implementation only after
a nonempty check actually runs and succeeds.

The receipt figures on the board are an illustrative rendering of the reviewed
Owner 1 fixture. They do not replace the catalog, canonical formatter, or
optimizer and must not be copied into storefront components as literals.

## Offline contract

The browser-safe fallback is synchronous and performs no fetches. It supports
the same intent categories as the model path: restyle, search, persona, ask,
deal, Undo, Reset, and ordinary chat.

Thai, English, and mixed messages produce localized fixed replies. Shopper
budgets are parsed locally. Units, ages, ratings, days, watts, and litres are
not silently treated as budgets.

## Development-agent contract

The optional model endpoint is development-only and unavailable in public
builds. The model receives a closed, price-free projection.

- Exactly two read-only tools: catalog search and listing read.
- Bounded tool rounds, per-call timeout, overall deadline, and output length.
- Missing key, forced offline, provider error, timeout, and unusable output all
  fall back to the same local parser and guard.
- Mixed-validity output preserves valid fields and drops invalid fields.
- A fully malformed envelope falls back.
- Only listings read this turn can be cited.

The browser trace may show allowlisted summaries, tool kinds, result counts,
bounded timing or usage, backend, model name, reason codes, guard outcome, and
merge outcome. It never exposes raw prompts, raw model replies, arbitrary
provider strings, private configuration, credentials, or private transcripts.

## Review focus

- Undo after an effective change and after a no-op.
- Stable tie-breaking independent of input order.
- Empty, singleton, constant-range, and missing-spec ranking cases.
- Ambiguous numeric phrases that are not budgets.
- A never-resolving model call that falls back within the deadline.
- An offline response during a model run counted under the actual model backend.
- Digit and currency reply guarding before shopper copy is rendered.
- Questions and deals leaving the store shape unchanged.
- The same optimizer receipt from both shopper contexts.

## Ownership

Owner 2 owns the engine, server adapter, projection, route, and tests. Owner 3
owns storefront components and interaction rendering. Owner 1 owns catalog and
pricing facts. Owner 4 owns shared contracts, integration fixtures, golden
labels, release checks, and coordinated guideline updates.

The Figma board is therefore a consumer contract and rehearsal aid, not the
main Owner 2 deliverable.
