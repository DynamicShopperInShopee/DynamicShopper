# DynamicShopper guidelines

These guidelines set out the idea of **DynamicShopper**: what the product should be, who it is for, how the system should be designed, how it should look, and why each decision is made. They describe ideas and rules, not code. Anyone building or changing the product should be able to make the same decisions from them.

## The idea in one paragraph

Marketplaces show everyone the same interface, but shoppers differ in what they need and in how they like to receive it: a spec table, pictures and reviews, or large print and three choices for an older parent. DynamicShopper is a storefront the shopper shapes by talking to it, in Thai, English or a mix. An AI agent listens and proposes how the store should look and what the page should contain. Deterministic logic does everything that touches a fact: which products match, in which order, at what real price. **The AI may change the presentation. It can never change a fact.** And the product does not just claim this: it proves it on screen.

In one sentence: *"Same products, same prices, a different store for every shopper. The AI only moves presentation. It can never touch a fact, and you can watch it try."*

## The guidelines

| Document | What it covers |
| --- | --- |
| [PRODUCT.md](PRODUCT.md) | The problem, the people, the promise, principles, scope and what success looks like |
| [SYSTEM-DESIGN.md](SYSTEM-DESIGN.md) | How the system is shaped: the presentation/fact split, the conversation pipeline, the bounded agent, the offline path, state, trust boundaries |
| [PERSONALIZATION.md](PERSONALIZATION.md) | The plan, the four levels of personalization, personas, the page-section library, ranking, explicit control |
| [TRUST-AND-PROOF.md](TRUST-AND-PROOF.md) | The facts lock and every surface that proves it: facts receipt, side-by-side compare, citations, X-ray, the poisoned model, the accuracy scoreboard |
| [PRICING.md](PRICING.md) | The voucher world, the stacking rules, how the best deal and top-ups are found |
| [EXPERIENCE.md](EXPERIENCE.md) | Screens, layout and interaction: the storefront, chat, product page, compare, mom mode, sharing, states, voice and language |
| [DESIGN.md](DESIGN.md) | The visual system, "The Thermal Receipt": colour, type, layout, shapes, components, themes and their rules |
| [CATALOG.md](CATALOG.md) | The simulated catalog, shops and vouchers, and why each exists |
| [JOURNEY.md](JOURNEY.md) | The core journey through the product, step by step |
| [AGENTS.md](AGENTS.md) | The rules every contributor and coding agent must keep |

## Vocabulary

| Term | Meaning |
| --- | --- |
| Presentation | Everything about how the store looks and is arranged: theme, layout, density, language, which details show, ranking emphasis, filters, page sections. The AI may change it. |
| Fact | Anything true about a product or a price: price, original price, rating, review count, units sold, shipping fee, spec values, voucher terms, deal totals. Only the catalog and the pricing logic produce facts. |
| Plan | The complete description of a shopper's presentation. The store is drawn from the plan plus the catalog. |
| Plan change | What the AI proposes: a partial update to the plan. Validated before it touches anything. |
| Persona | A named, ready-made plan: Tech minimal, Visual vibrant, Mom mode. |
| Section | One block of a composed page, chosen from a fixed library. |
| Focus products | What the shopper is looking at right now: the open product, else the products the assistant just pointed at, else the top three on screen. |
| Offline mode | The keyword understanding that answers when the AI is absent, slow or wrong. Same kind of answer, clearly labelled. |
| Proof surface | A part of the UI whose job is to show that the facts are intact. |
