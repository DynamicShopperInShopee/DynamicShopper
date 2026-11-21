# Product

## One line

> The right products, the right information and the right interface for each shopper, with the facts locked.

## Optional sourced shopping preview

The standalone shopping preview uses dated Shopee Thailand listing observations with original source links. The shopper can browse first, then finish an optional four-question interview to apply a validated presentation, see its changes and use Undo or chat. Closing an unfinished interview discards its draft. Separate comparison examples are editable demonstrations. The main storefront keeps its own preview and Apply flow.

Seven sourced listings and their photos ship with the standalone preview. The same-origin catalog service supplies additional listings. A previous visit can provide the complete offline release when its saved contents match the published checksum. Observed amounts can depend on the chosen variant and buyer conditions. Missing stock, shipping, ratings and reviews remain unknown. A local read-only API and a separate catalog Worker can serve the same records. See the [dataset](../catalogs/shopee-2026-11-21/README.md) and [catalog service](../deploy/catalog/README.md).

## The problem

1. **One interface for everyone.** Shoppers differ in what they need and in how they like to receive information. A tech buyer wants a spec table. Another shopper wants pictures and short summaries. Someone buying for an older parent needs large print, Thai and fewer choices. A marketplace that shows everyone the same grid serves none of them well.
2. **The real price is hard to know.** Shop vouchers, platform vouchers, shipping vouchers and coins stack, each with minimum spends and caps. Shoppers wait for sales precisely because the final price depends on these stacks, and almost nobody can work out the cheapest legal combination by hand.
3. **Shoppers do not trust an AI that can rewrite the store.** If an AI can reshape the page, it could also misstate a price. Online shopping already carries a lot of fraud, and the risk people name most about shopping agents is an agent acting beyond what the shopper authorised. Trust, not capability, is the real obstacle to AI shopping.

## The promise

Give the AI wide freedom over presentation and **zero authority over facts**, and prove it live.

- The AI proposes how the store should look and what the page should contain. It never writes prices, product text, markup or the order of products.
- Deterministic logic decides which products match, ranks them, and prices deals exactly.
- Every number on screen comes from the catalog or the pricing logic, and every one can be checked. The store re-checks itself after each change, two personalized stores can be compared fact by fact, and a hostile AI can be simulated in one click to show that nothing factual moves.

## Who it is for

| Shopper | What they need | What the store becomes |
| --- | --- | --- |
| **The tech buyer** comparing gaming mice, earbuds, power banks | Specs first; ranking by what they care about; no decoration | Minimal, a comparison table with the specs they care about first, ranking by their priorities ("battery higher, weight lower"), a plain explanation of the order |
| **The visual shopper** | Pictures, short summaries, what other buyers say | A colourful card grid, top picks up front, review quotes |
| **The family member buying for an older parent** ("mom mode") | Large print, Thai, three clear choices, the real price, something easy to send to the parent | Large print, Thai, three products, a plain-words guide to what matters, the best deal already worked out, and a share link |

Everyone who uses the store should come away believing two things at once: "the store adapts to me" and "it cannot lie about prices".

## Product principles

1. **Facts are sacred.** Presentation may change; numbers may not. The AI's own words never contain a number.
2. **Every AI change is visible and reversible.** Each change is explained in a short "What changed" note, shows up as removable chips, and can be undone in one step. Reset is always one click away.
3. **Show the proof, not the claim.** Every promise about facts has a surface that demonstrates it.
4. **Never depend on the network.** With no AI key, no connection or a misbehaving model, the store still understands the shopper through a keyword fallback, labelled "Offline mode".
5. **Explicit control beats inference.** Chips, a persona picker, Undo, Reset, a language switch, category tabs and a search box always work, and what the shopper sets directly is never overridden by guesswork.
6. **Same truth for everyone.** Two shoppers may see very different stores, but every shared fact is identical.
7. **Thai and English are equal.** Every word of the interface exists in both, and mixed-language messages are normal input.

## Scope

### What the product should do

- **Chat reshapes the store.** A message in Thai, English or a mix changes theme, layout, density, language, which details cards show, ranking priorities, filters and which sections the page contains.
- **Explicit control.** A preferences bar of removable chips, a persona picker, Undo, Reset, a language switch, category tabs and search.
- **Deterministic ranking** over catalog facts and the shopper's priorities, with a "Why this order?" explanation that uses no numbers.
- **Voucher optimizer.** The best legal voucher and coin stack as a printed receipt, reasons for every unused voucher, and "Only if you need it" add-ons that unlock a voucher at a known extra cost.
- **Agent-composed pages.** The AI reads the catalog with read-only tools and composes the page from a fixed library of fact-locked sections.
- **Share with family.** A link (and a LINE share) that carries the store's look, nothing personal.
- **Compare views.** Two personas side by side on the same search, with a check that the facts are identical.
- **Mom mode.** Large print, Thai, three choices, reachable from chat ("ซื้อให้แม่ อายุ 65") or the persona picker.
- **Product questions with citations.** Answers only by pointing at the listing's specs, reviews or summary.
- **X-ray and red team.** A view of the pipeline behind the last reply, a "Force offline" switch, and a simulated poisoned model.
- **Accuracy scoreboard.** How well the AI and the fallback understand a golden set of about sixty real shopper messages, and how many facts either one leaked (the target is zero).
- **Product pages** shaped by the same plan.

### What it deliberately does not do

- The main storefront uses a simulated catalog. Neither shop provides accounts, checkout or payment. The agent never adds to the cart and never buys.
- Shopper preferences and Undo stay in the browser. The optional preview's database stores sourced catalog observations.
- No AI-written markup, copy blocks or images. The page is built only from fixed, fact-locked parts.
- No seller analytics, photo search, voice input or long-term behaviour tracking.
- No public deployment of the AI endpoint. It runs locally.

### Anti-goals: failure even if it "works"

- Any number on screen that did not come from the catalog or the pricing logic.
- The AI stating or changing a price, spec, stock level or voucher value anywhere.
- A message that leaves the page broken or unreadable: bad contrast, lost navigation, blank cards.
- A store that needs a live AI call to work.
- A "best deal" that breaks a stacking rule or misses a cheaper combination.
- Agent behaviour the shopper cannot see.
- The shopper losing the product list.

## Brand

- Name: **DynamicShopper**. Independent and not affiliated: no Shopee logos or marks, and "coins", never a branded coin. At the user's explicit request, the default storefront uses an orange marketplace shopping header and photo grid; personalized receipt themes retain the neutral system. This presentation exception does not permit invented promotions or product facts.
- Personality: calm, exact, honest. A thermal receipt, not a sale banner (see [DESIGN.md](DESIGN.md)).

## Success looks like

- Two shoppers with the same need get visibly different stores, and the store proves the facts are identical.
- An explicit preference change produces the matching store change; Undo and Reset always work.
- Ranking responds to several priorities at once.
- Invalid, unavailable or hostile AI output leaves a usable store.
- The whole experience works with no network and no key.
- The keyword fallback understands at least four in five golden messages and leaks no facts; the AI is expected to do better, especially on slang.
- Every theme meets WCAG AA; large print keeps text at 20px or more and tap targets at 48px or more; nothing scrolls sideways on a laptop or a phone.

## Accessibility and inclusion

- Every theme passes WCAG AA contrast, and this should be checked automatically.
- Large print is a real mode, not a zoom: bigger base text, a 20px minimum, 48px targets, fewer products, Thai.
- Fully usable by keyboard and screen reader; focus moves sensibly when panels open and close; Escape closes them.
- No motion at all for shoppers who ask for reduced motion.

## Honesty

- The main storefront labels its catalog and vouchers as simulated. The standalone preview identifies the source and observation date for listing facts.
- There are no real users, testimonials or metrics, and none may be invented.

## Ideas for later

Seller insight into what shoppers ask for; photo search; Thai voice input for mom mode; gentle sort suggestions from browsing (never applied automatically); plain-language specs in mom mode ("about 10 cups" next to 1.8 L); running against a local model.

Shoppers can compare two products they select and choose the fields to inspect. A selection outside the current results is identified in the comparison. Selections stay in the open tab. The deal task takes an explicitly selected product and uses the same quantity and optimizer as the shelf.
