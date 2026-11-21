# Personalization

## The plan

The plan is the complete description of how one shopper's store looks. It is small, readable and fully enumerable, which is what makes it safe to hand to an AI.

| Part | Choices | What it controls |
| --- | --- | --- |
| Theme | Standard, Minimal, Vibrant, Large print | The visual token set (see [DESIGN.md](DESIGN.md)) |
| Layout | Grid, List, Comparison table | The shape of the product area |
| Density | Compact, Comfortable, Spacious | Spacing inside cards |
| Language | Thai, English | All interface and product text |
| Card details | Image, Price, Rating, Key specs, Summary, Reviews, Shipping, Vouchers, Shop (an ordered subset) | What each product shows, and in which order |
| Highlighted specs | Spec names of the active category | Which specs lead in cards, tables and the guide |
| Search words | Free words | Which products match (all words must match a name, tag or category, in either language) |
| Ranking priorities | Price, Performance, Durability, Design, Rating, Value, each 0–1 | How products are ordered |
| Spec preferences | Spec + "higher is better" or "lower is better" | Extra ordering terms, e.g. battery higher, weight lower |
| Filters | Category, maximum price, shops, Mall only | Which products are eligible |
| Simplified | On / off | Only the top three products (mom mode) |
| Page sections | An ordered list from the section library | What the page is made of |

Every part has a closed list of allowed values. Nothing in the plan is free text except search words, and those are checked before an AI-chosen phrase is accepted.

Card details are rendered as an ordered subset on grid cards, list cards and Top picks. The product name and Best price action remain available even when their optional fields are omitted. Images can appear anywhere in the selected order. Specs use highlighted keys first; review excerpts and rating counts come directly from the catalog. Vouchers show the optimizer-selected combination for the same single-product basket and clock used by Best price, without reproducing discount arithmetic in the card.

## Four levels of personalization

| Level | The shopper says | The store changes |
| --- | --- | --- |
| **Product** | "under 1500", "battery and light weight", "Mall shops only" | Filters and ranking |
| **Information** | "specs first", "show reviews" | Which details lead on each product |
| **Interface** | "ขอแบบเรียบๆ", "colourful", "bigger text", "in Thai" | Theme, layout, density, language |
| **Page** | "compare the top 3", "gift for mom", "a best value page" | Which sections the page holds, and their order |

## Personas

A persona is a ready-made plan, for shoppers who prefer to pick a style rather than describe one. Each starts from the standard store and changes only what defines it.

| | Standard | Tech minimal | Visual vibrant | Mom mode |
| --- | --- | --- | --- | --- |
| Theme | Standard | Minimal | Vibrant | Large print |
| Density | Comfortable | Compact | Spacious | Spacious |
| Layout | Grid | Comparison table | Grid | List |
| Language | English | keeps the shopper's | keeps the shopper's | Thai |
| Card details | Image, price, rating, shop, shipping | Price, key specs, rating, shop | Image, price, summary, reviews, vouchers | Image, price, summary, shipping |
| Priorities | Rating, then value | Performance, then value | Design, then rating | Rating, then durability |
| Products shown | All | All | All | Top 3 |
| Page | Products | What matters, Products | Top picks, What buyers say, Products | Top picks, What matters, Best deal, Share with family, Products |

A persona's language wins only when it is part of its identity (mom mode is Thai); the others keep whatever language the shopper uses.

## The page-section library

The AI does not design pages freely. It chooses from **seven fixed sections** and orders them. Each section is a fixed, reviewed component that shows only catalog facts, and each disappears completely, heading included, when it has nothing to show.

| Section | What the shopper sees | Why it exists |
| --- | --- | --- |
| **Top picks** | The three best-ranked products as large cards, each with a short "biggest reasons first" panel (bars, no numbers) | Decision help for shoppers who want a recommendation, not a list |
| **Compare top 3** | A side-by-side table of the three best products | For "compare" requests when the main layout is not already a table |
| **What matters** | The shopper's priorities in plain words ("Rating and durability first") and each spec that matters with its direction ("Battery: higher is better"). No values | Teaches what to look for; reassures that the ranking follows the shopper |
| **What buyers say** | Up to two review quotes for each of the top three, preferring quotes that mention a spec the shopper cares about | Social proof for visual and gift shoppers |
| **Best deal** | The optimizer's receipt for the top product: vouchers, coins, the real total | The real price, already worked out |
| **Share with family** | Copy a link, or send it over LINE; a note that only the look is shared | Set up a store for a parent and send it |
| **Products** | The complete filtered product area (grid, list or table) | The shopper never loses the full list |

Rules:

- The products section is always on the page. If a proposal leaves it out, it is added at the end.
- At most seven sections, no duplicates, unknown ones dropped.
- Accepted: Top picks and Compare may repeat products in Products. Retain the complete filtered shelf so a recommendation never removes the shopper’s product list, including simplified mode.
- If the layout is already a comparison table, Compare top 3 does not appear (no two tables).
- When the filters match nothing, the page shows one empty state that names the filters, not a column of empty sections.
- A page that is only Products looks exactly like the standard store, with no section headings.
- The page's Best deal shows no add-on suggestions: on a one-product page, add-ons from unrelated categories read as noise. The chat's deal keeps them.
- In side-by-side compare, panes skip Best deal and Share (one needs a cart, the other is a page-level action).

## Ranking

Ranking is deterministic, explainable logic. The AI only ever sets priorities; it never orders products.

1. **Filter.** Keep products that match the category, the budget, the shop filters and every search word.
2. **Score.** Each product's score is a sum of terms, each a priority weight times a 0–1 measure, normalized within the filtered set:
   - Price: cheaper scores higher.
   - Rating: higher rating scores higher.
   - Performance, durability, design, value: curated 0–1 scores per product.
   - Each spec preference: the spec value scaled across the set, flipped when lower is better (lighter, lower latency).
3. **Order.** Highest score first; ties go to the better seller, then a stable name order.
4. **Simplify.** In simplified mode, keep only the top three.

Because the explanation reads **the same terms** the score sums, "Why this order?" can never disagree with the order. It shows the three biggest terms as labelled bars in four width steps, with no digits anywhere. It is not offered for a lone product, in simplified mode or in compare panes, where it would add noise.

A reference case for ranking: for a shopper who wants a gaming mouse with long battery and light weight under ฿1,500, exactly three mice remain and **Aero X** comes first.

## Explicit control

Chat is the main control, but never the only one.

- **Preferences bar:** one removable chip for every way the current plan differs from the standard store (theme, layout, density, language, search words, category, budget, shops, Mall only, each spec preference). Removing a chip undoes exactly that one thing.
- **Persona picker:** applies a persona as one undoable step.
- **Undo:** steps back through recent plans. Disabled when there is nothing to undo.
- **Reset:** back to the standard store. Disabled when the store is already standard.
- **Language switch, category tabs, search box:** direct plan changes. Picking a new category clears old search words, because they rarely match a new category (chat does the same).
- **"What changed":** every change, from chat or a shared link, is explained in plain words. A change that changes nothing says nothing.

What the shopper sets explicitly is applied as-is and can always be seen and removed.

## Sharing a store

A shopper can share their store's look as a link. The link carries the plan and nothing else: no cart, no conversation, nothing personal. Opening one is treated as untrusted input: it is validated exactly like an AI proposal, opened as one undoable step with a "Shared store opened" note, and ignored silently if it is invalid or oversized. The intended use is the family case: set up mom mode with rice cookers, then send it to the parent over LINE.
