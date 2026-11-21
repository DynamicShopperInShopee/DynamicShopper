# Shopee Adaptive UX — User-flow specification

Status: prototype specification  
Surface: Shopee buyer experience, mobile first  
Source constraints: `AGENTS.md`, `guidelines/PRODUCT.md`, `guidelines/SYSTEM-DESIGN.md`, `guidelines/DESIGN.md`, `METHODS.html`, `REPORT.html`

## Outcome

A shopper begins with the familiar standard Shopee experience. They may complete a short, optional interview. The storefront then adapts gradually as the shopper uses it, while every change remains visible, reversible, and fact-safe.

The system must feel like Shopee becoming more useful, not a new marketplace replacing Shopee.

## Smallest experience that proves the idea

Five connected mobile states:

1. Standard Shopee home.
2. Optional preference interview.
3. First adapted home after explicit answers.
4. Learning state after repeated sessions.
5. Mature personalized home with explanation and controls.

The prototype proves the transition between these states. Product facts, prices, seller data, and promotion terms remain catalog-owned throughout.

## Domain model

The experience is modeled as a state machine, not a collection of unrelated persona pages.

```ts
type AdaptationStage =
  | "baseline"
  | "interview"
  | "seeded"
  | "learning"
  | "mature";

type EvidenceSource =
  | "explicit_answer"
  | "explicit_control"
  | "session_behavior"
  | "public_context";

type Preference = {
  key: string;
  value: string;
  source: EvidenceSource;
  confidence: "confirmed" | "tentative";
  expiresAt?: string;
};

type ExperiencePlan = {
  stage: AdaptationStage;
  language: "th" | "en";
  layout: "standard" | "visual" | "compact" | "spec-first" | "comfort";
  density: "comfortable" | "standard" | "dense";
  sections: string[];
  cardFields: string[];
  priorities: string[];
  preferences: Preference[];
};
```

Facts are deliberately absent from `ExperiencePlan`. The plan decides presentation only.

## State transitions

```text
baseline
  ├─ skip interview ───────────────→ learning
  └─ start interview → interview
                           ├─ cancel → baseline
                           └─ finish → seeded → learning → mature

Any adapted state
  ├─ Undo last change
  ├─ Reset to standard Shopee
  └─ Edit preferences
```

### Transition rules

- `baseline` is the actual standard Shopee layout and navigation.
- The interview is optional, skippable, and resumable.
- Explicit answers create confirmed preferences.
- Behaviour creates tentative preferences only.
- A tentative preference changes at most one low-risk presentation dimension at a time.
- Sensitive situations are never inferred.
- Every applied change produces a deterministic “What changed” record.
- Reset returns to baseline without deleting order history, cart, or wishlist.

## Signal priority

When signals conflict, use this order:

1. Current explicit control.
2. Interview answer.
3. Current-session behaviour.
4. Repeated behaviour across sessions.
5. Public context selected by the shopper.

The system never overrides an explicit choice with inferred behaviour.

## Flow A — first visit

### A1. Standard Shopee home

Purpose: preserve recognition and trust.

Required UI:

- Shopee header, search, cart, chat, categories, campaigns, recommendations, and bottom navigation.
- A small “Make Shopee fit me” entry card after the first content block.
- “Not now” dismisses it for the session.
- No automatic restyle before the shopper acts.

Primary action: search or browse as usual.  
Secondary action: start the interview.

### A2. Preference interview

Purpose: obtain strong evidence with minimal effort.

Presentation: bottom sheet on mobile, centered dialog on desktop.

Questions, one per step:

1. What are you usually trying to do? Compare / discover / buy quickly / buy for someone.
2. What matters most? Price / quality / design / performance / ease of use / delivery.
3. How much detail do you prefer? Simple / balanced / detailed.
4. Which shopping help is useful? Best total / comparison / complete a set / refills / none.
5. Optional accessibility: larger text / reduced motion / standard.

Rules:

- Show progress without pressure.
- Every question can be skipped.
- The final screen previews changes before applying them.
- No question asks about health, pregnancy, debt, relationships, or another sensitive condition.

### A3. First adaptation

Purpose: make the benefit immediately understandable.

Required UI:

- The standard shell stays fixed.
- Only section order, density, card fields, and supporting modules change.
- A receipt-style “What changed” panel lists each difference.
- Preference chips expose the active answers.
- Undo and Reset are available from the panel.

Example:

```text
What changed
• Comparison appears before recommendations
• Product cards show specifications first
• Fewer promotional sections are shown
```

## Flow B — learning over time

### B1. Sessions one to three: observation

- Learn only from actions within the shopping session.
- Do not silently change the overall theme.
- Offer a suggestion: “You often compare specifications. Put comparison first?”
- Applying the suggestion requires one tap.

### B2. Sessions four to seven: tentative adaptation

- A repeated pattern may alter one low-risk dimension.
- Examples: place reorder items earlier; keep the preferred result density; surface compare controls.
- Show a small “Changed for you” marker once.
- The marker opens the evidence and reversal controls.

### B3. Ongoing: mature personalization

- Use confirmed preferences plus stable repeated behaviour.
- Personalize the order of fixed, fact-locked modules.
- Expire temporary moments automatically.
- Provide a preference center containing:
  - confirmed preferences;
  - tentative preferences;
  - the evidence source;
  - last-used date;
  - remove and pause controls.

## Flow C — changing context

One person may need different interfaces for different tasks.

```text
Buying a gaming mouse → spec-first
Buying detergent again → quick reorder
Buying for a parent → comfort and share
Checking a basket → final-total and voucher proof
```

Context is session-scoped unless the shopper confirms that it should persist.

## Adaptive UI contract

### Fixed layer

- Brand shell.
- Search.
- Category access.
- Cart and wishlist.
- Account and order tracking.
- Product list.
- Direct controls.

### Adaptive layer

- Section order.
- Product-card detail order.
- Information density.
- Comparison prominence.
- Supporting modules such as complete-the-set, refills, or family share.
- Theme variant within approved brand tokens.

### Fact layer

- Price and original price.
- Rating and review count.
- Units sold.
- Shipping.
- Specifications.
- Voucher terms and totals.
- Seller, stock, warranty, and certification data.

The adaptive layer can select where facts appear. It cannot write or alter them.

## Interview-to-plan mapping

| Answer | Plan change | Never changes |
| --- | --- | --- |
| Compare | comparison section first, compare tray visible | product order without ranking logic |
| Discover | visual cards, review media earlier | review facts |
| Buy quickly | compact repeat-purchase and delivery modules | checkout totals |
| Buy for someone | simple choices, share, alternate address | recipient assumptions |
| Price | final payable total and value comparison earlier | price itself |
| Performance | specifications and deterministic ranking reasons earlier | specifications |
| Simple detail | fewer fields and larger summaries | underlying catalog |
| Detailed | denser tables and filters | fact source |
| Larger text | minimum twenty-pixel body, forty-eight-pixel targets | content meaning |

## Honest learning rules

1. No sensitive inference.
2. No individualized price.
3. No fake scarcity or countdowns.
4. No preselected add-ons.
5. No adaptation that hides the product list.
6. No dark-pattern opt-out.
7. A question never changes the store.
8. A deal request never changes ranking.
9. Every recommendation can explain why it appeared.
10. Every adaptation can be undone or reset.

## Verification scenarios

### Scenario one — skip interview

Given a first-time shopper, when they skip the interview, the page remains the standard Shopee experience and all normal shopping actions work.

### Scenario two — explicit preference

Given a shopper selects detailed comparison and performance, when they apply the preview, the page becomes spec-first, a “What changed” receipt appears, and product facts remain identical.

### Scenario three — gradual learning

Given the shopper repeatedly opens comparison, when the system has enough repeated evidence, it asks before making comparison primary. One isolated click does not trigger a redesign.

### Scenario four — changing task

Given a spec-first shopper enters “buying for mom,” the session can switch to comfort mode without overwriting the shopper’s general preference.

### Scenario five — reset

Given any adapted state, when Reset is selected, presentation returns to baseline while cart, wishlist, and orders remain unchanged.

### Scenario six — offline

Given no network or AI key, the interview, explicit controls, saved plan, reset, and keyword fallback still work.

## Metrics

Primary user metrics:

- Task completion.
- Product-fit confidence.
- Time to confident choice.
- Recommendation dismissal.
- “Felt pressured” score.
- Returns and cancellations.

Business metrics:

- Conversion.
- Compatible-item attach rate.
- Revenue per session.
- Repeat purchase.

Guardrails:

- Fact violations remain zero.
- Budget violations remain zero.
- Complaints, returns, and pressured-shopping scores must not worsen.

## Pstack throughput checkpoint

- **Blocking first steps:** establish baseline Shopee state, adaptation state machine, and fact/presentation boundary before adding screens.
- **Independent workstreams:** specification and visual storyboard are independent after the state model is fixed.
- **Shared mutable state:** the `ExperiencePlan` is the single presentation state; catalog and pricing remain separate read-only inputs.
- **Smallest safe decomposition:** one storyboard proves the transition before expanding the full component library.

## Figma deliverables

1. Flow page: baseline → interview → seeded → learning → mature.
2. Screen page: high-fidelity mobile states.
3. Components page: standard shell, interview sheet, preference chips, “What changed” receipt, evidence panel, Undo, Reset.
4. Annotation page: rules, data source, and measurement notes.

