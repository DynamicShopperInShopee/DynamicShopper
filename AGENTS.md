# Rules for contributors and coding agents

Everyone who shapes DynamicShopper, human or AI, should keep these rules. They protect the product's one promise: **the AI may change the presentation, never a fact.** Read [PRODUCT.md](guidelines/PRODUCT.md) and [SYSTEM-DESIGN.md](guidelines/SYSTEM-DESIGN.md) before designing anything, and [DESIGN.md](guidelines/DESIGN.md) before any visual work.

## Product rules

1. **Facts come only from the catalog and the pricing logic.** Price, original price, rating, review count, units sold, shipping, specs, voucher terms and deal amounts are never computed, rounded, restated or invented anywhere else.
2. **Every fact on screen is checkable.** Each one names which fact it is and carries its raw value, and its visible text is a faithful formatting of that value.
3. **Money is whole baht.** Discounts round down. No fractional prices.
4. **The AI only proposes plan changes.** Never markup, never copy blocks, never a product order, never a number.
5. **The AI never sees a price.** Not in its instructions, not in product context, not in what its tools return.
6. **Validate part by part.** A bad part of an AI proposal is dropped on its own and noted; the good parts survive. Allow known values; never try to block bad ones.
7. **The reply guard fails closed.** Any AI sentence with a digit or currency mark is replaced. Never loosen it to make a reply nicer.
8. **Questions cite or decline.** An answer without a valid citation says it cannot confirm.
9. **Offline is a first-class path.** The keyword fallback gives the same kind of answer as the AI. Nothing should depend on the network or an AI key to work.
10. **The agent stays bounded.** Read-only tools, a few rounds, a hard time limit, a small reading budget, every step visible. Any failure falls back.
11. **Ranking is deterministic and explainable.** The explanation reads the same terms the order used and shows no numbers.
12. **One pricing path.** Every deal, everywhere, comes from the same optimizer and the same simulated coin balance.
13. **Sections come from the fixed library.** No section shows anything but catalog facts; each disappears when empty; the product list is always on the page.
14. **Anything from outside is untrusted:** requests, AI output, tool arguments, shared links, saved browser state.
15. **Debug powers are limited.** Force offline is always allowed; the poisoned model is for development only. Credentials never reach the browser; only the model name may appear in X-ray.
16. **A question never changes the store; a deal request never re-ranks it; reset and undo belong to the store itself.**

## Experience rules

- Every AI change is visible ("What changed", chips) and reversible (Undo, Reset).
- Explicit controls always work and are never overridden by inference.
- Thai and English are equal: every string exists in both, written for each language.
- The store stays usable after any message: readable, navigable, never blank.
- Green and red mean state only. A stamp appears only where a check ran and passed.
- New proof surfaces look like receipt slips. No shadows, gradients, badges, banners or marketplace chrome. No Shopee marks.
- Every theme meets WCAG AA; large print keeps 20px text and 48px targets; reduced motion means no motion.
- Every screen works at laptop (1440×900) and phone (390×844) size with no sideways scroll.

## Ways of working

- **Every rule should be provable.** Each product rule above deserves an automated check that states the behaviour. A broken rule is fixed by first showing it is broken.
- **Keep the golden set honest.** Golden messages are written as real shoppers write, never tuned to what the fallback understands. The fallback's understanding should only ever improve.
- **The core journey always works.** [JOURNEY.md](guidelines/JOURNEY.md) should work end to end, offline included, after every change.
- **Small, reviewed changes.** One idea per change, read by someone who did not write it, checked against these rules.
- **Ideas and concerns are written down.** A new idea gets a status (proposed, accepted, dropped) and a one-line reason. Every concern raised is either resolved or written down with a decision.
- **The guidelines move with the product.** A change to behaviour updates these guidelines; a change to the visual system updates [DESIGN.md](guidelines/DESIGN.md).
- **Keys and secrets stay private.**
- **Stay lean.** New third-party libraries need a written reason.

## Team workflow

- Pick one [team assignment](README.md#choose-your-team-assignment) per coding session. Work in this repository on your own task branch. Start from the team's agreed baseline. Commit and push small, reviewable increments to that branch.
- Each assignment names its owner, owned paths, consumers and acceptance check. Use Astra for shared design decisions and Sol for scoped implementation. Give agents the relevant guideline, contract, diff and test result.
- The producer and an affected consumer agree on shared contract changes. The integration owner coordinates shared configuration and reconciles these rules at every merge. Include guideline edits in the same PR as the behavior they govern.
- Before merging, sync with main, resolve conflicts with the affected owner, rerun the affected checks and obtain review from someone other than the author. Record what passed on the combined tree.
- Keep keys, private configuration, raw conversations and event access materials out of commits, review evidence and public artifacts. Use synthetic examples for handoffs.

## Before calling anything done

- Does any number on screen come from somewhere other than the catalog or the optimizer? Then it is not done.
- Can a hostile AI output reach the screen through this change? Try it with the poisoned model.
- Does it work offline?
- Does it work in all four themes, in Thai and English, on a phone?
- Is every change the shopper did not make explained and undoable?
