# System design

## Sourced catalog backend and cloud delivery

The sourced shop loads one validated `CatalogSnapshot` from a read-only API.
Local SQLite and the separate Cloudflare catalog Worker/D1 runtime use the same
catalog DTO and query validation. `catalog_items` and `catalog_meta` persist the
observed listing facts; unrelated authentication tables are preserved. Metadata
is published only after imported items, and Worker reads batch metadata and
items consistently. There is no public import or product-write endpoint.
The cloud package contains the built shopping frontend and original image
assets, not the Node/auth scaffold, raw observations or database files. See
[cloud delivery](../deploy/catalog/README.md).

The versioned snapshot contains 1,500 records observed on 2026-11-21, with source
URLs, exact whole-baht amounts and per-listing timestamps. Publication does not
refresh observations, complete checkout integration or run a background ingestion
agent. All layouts and comparison examples share the same fetched snapshot. A
validated browser copy supports offline search and CNN personalization; the
seven-record starter fallback is explicitly labeled when both API and saved
catalog are unavailable. Images require the cloud/local image service or an
existing browser image cache. See [the dataset](../catalogs/shopee-2026-11-21/README.md).

## Browser interview integration

The optional storefront interview runs exported Conv1d and dense weights locally.
Only allowlisted answer IDs enter inference; product facts never enter the network.
Independent categorical heads expand to fixed layout, details and section recipes;
invalid heads retain their direct-answer fallback independently. The existing
proposal validator checks the final patch. A complete interview may also suggest
an unlocked theme; explicit reading settings and priorities remain deterministic.

Completing the interview preserves current filters and records one atomic change,
then focuses its receipt with Undo and chat refinement. Undo restores both plan
and interview metadata; equivalent settings create no extra Undo step. There is
no separate preview/Apply gate. The fixture-backed renderer retains its existing
catalog, deterministic ranking and optimizer. The sourced adapter uses its
read-only catalog snapshot and does not invent unsupported ranking or deal facts
or transfer synthetic product references into the sourced shelf. The optional
local live assistant remains development-only, while the interview and chat
fallback work without network access after loading.

## The central decision: split presentation from facts

Everything in the system follows from one split.

| | Presentation | Facts |
| --- | --- | --- |
| What it is | How the store looks and is arranged | What is true about products and prices |
| Examples | Theme, layout, density, language, which card details show, ranking priorities, filters, page sections | Price, original price, rating, review count, units sold, shipping fee, specs, voucher terms, deal totals |
| Who decides | The shopper, through chat or direct controls; the AI may propose | Only the catalog and the pricing logic |
| Where it lives | The **plan** | The **catalog** |
| Can the AI change it? | Yes, through validated plan changes | Never |

The store on screen is always *plan + catalog → page*. The AI can only ever touch the first input. This makes the promise structural rather than behavioural: the AI does not "try hard not to" misstate a price; it has no path by which a price could reach the screen.

### Why a plan, and not tools that edit the page

Three approaches were weighed:

| Approach | Verdict |
| --- | --- |
| **The AI returns one validated change to the plan** | **Chosen.** One message is one atomic, inspectable, undoable change. It can be validated field by field, diffed into plain words, saved and shared. |
| The AI calls fine-grained UI tools one by one (set theme, sort by…) | Rejected for UI changes. More "agentic" theatre, but hard to validate as a whole and hard to undo as one step. |
| Keyword rules only | Kept, but only as the offline fallback. Bulletproof, but not intelligent. |

The agent *does* use tools, but only to **read** the catalog before it decides; its decision is still one plan change.

## What the AI is allowed to see

The AI never sees a price. Its view of the world is:

- The rules of the store: allowed themes, layouts, fields, weights, sections, personas and the spec keys of each category.
- The catalog as names, categories and tags, without numbers that matter for buying.
- For at most three products in focus: specs, review quotes and the summary, in the shopper's language. Never price, original price, shipping fee, units sold, rating or review count.
- The shopper's current plan, the last few turns of conversation, the cart and recently viewed products (as ids).

Reasoning: an AI cannot misquote what it never saw, and anything price-shaped in its context would tempt it to repeat it.

## Explicit interview entry

The root storefront can also obtain a presentation proposal from the optional
four-question interview. The browser model receives answer IDs only and feeds
the same proposal validator. Draft answers are isolated. Completing the fourth
step immediately passes one validated patch to the change function and undo stack,
closes the sheet and focuses the change receipt with Undo and chat refinement.
There is no separate review/Apply gate or manual UI chooser. Full answers use
the browser CNN; skipped/partial answers and model failure use the deterministic
answer mapping. Skipped settings are preserved and closing an unfinished draft
is inert. Comparison examples cannot mutate the shop. Catalog facts stay on
their existing paths, and unsupported sourced facts or ranking inputs are not
invented. See
[the integration contract](../docs/INTERVIEW-INTEGRATION.md).

## The conversation pipeline

Every message travels the same path, online or offline.

```
Shopper message
  → Understand      the AI agent (or the keyword fallback when the AI is absent, slow or wrong)
  → Validate        keep each valid part of the proposed change; drop each invalid part on its own
  → Guard           replace any reply that contains a digit or a currency mark
  → Interpret       a question never changes the store; a deal request never re-ranks; reset and undo are done by the store itself
  → Price           a deal request runs the optimizer on the right products
  → Apply           the store merges the change into the plan, records one undo step, explains what changed
  → Rank            deterministic ordering over catalog facts
  → Render          the page sections in plan order, every fact from the catalog
  → Re-check        the page reads its own facts back and compares them with the catalog
```

### Understanding: what a message can mean

Every answer is classified into one intent:

| Intent | Meaning | Effect on the store |
| --- | --- | --- |
| Restyle | Change look, layout, details or page sections | The plan changes |
| Search | Change what is shown: category, words, budget, priorities | The plan changes |
| Find deal | "Cheapest way to get this?" | No re-ranking, no restyle; a priced deal appears in chat |
| Persona | "Shopping for my mom" | The persona's plan, then any extra change |
| Reset | Start over | Back to the standard store |
| Undo | Take back the last change | One step back |
| Ask | A question about a product | Store unchanged; the answer cites the listing |
| Chat | Anything else | Store unchanged; a short help text |

Language follows the shopper: a message with Thai script is answered in Thai, otherwise in the language of the interface.

### Validation: drop the bad part, keep the rest

A model's proposal is never accepted or rejected whole. Each field is judged on its own against an allowlist:

- An unknown theme, layout, density, language, card field or section is dropped; the valid fields beside it survive.
- Spec keys must exist in the active category (and must be numeric to be used for ranking).
- Weights are clamped to the 0–1 range; budgets become whole baht of at least 1.
- Product ids must exist in the catalog; shop ids must be real shops.
- An empty list of card fields is ignored, because it would blank every card.
- A search phrase the AI chose is kept only if it contains no digits or currency and still matches at least one product, so the AI cannot empty the store or print a number through the search box.
- Every dropped piece is recorded by name, so the X-ray can show exactly what was refused.

The result can always be merged into any plan and still produce a valid plan.

### The fact guard: fail closed

The AI is told never to put numbers in its reply. The guard does not trust that. Any reply that contains **any digit in any script, any currency symbol, or the words baht, บาท, THB or USD** is replaced wholesale by a fixed, friendly template for its intent ("I've restyled the store to your taste."). Long replies are cut at a word boundary. The guard is deliberately crude: a false alarm costs a slightly blander sentence; a miss would cost the product's whole promise.

### Merging and undo

- A change merges into the current plan: lists replace, ranking weights and filters merge, and a filter can be explicitly cleared.
- When the category changes, preferences and highlighted specs that the new category does not have are dropped, so the store never asks for a spec it cannot show.
- A change that leaves the plan identical creates no undo step. Otherwise the previous plan is pushed onto a short undo history.
- "What changed" is computed by comparing the old and new plans, not written by the AI. It names each difference in the shopper's language and phrases ranking as priorities ("Rating and durability first"), never as percentages.

## The agent

The AI is a **bounded agent**: it may look before it decides, but within hard limits.

- **Two read-only tools.** *Search the catalog* (by words, category and an optional price ceiling, applied on the store's side; returns up to ten matches as names, categories and tags, never prices). *Read a listing* (specs, reviews and summary of products; at most three listings per message, including the ones already in focus).
- **At most three rounds of tool use**, then the agent must answer.
- **Time limits:** each model call is cut off after a few seconds, the whole loop after about twelve. Output length is capped.
- **Tools are pure:** they only read the catalog. They cannot change the cart, the plan, or anything else.
- **Every step is recorded:** which tool, with what arguments, how many results, how long it took, and the total token usage. These appear in X-ray.
- Products the agent read become citable in an answer; nothing else does.

When to use tools: for vague or multi-need requests ("something for my mom", "a gift under 1000") and for questions about products not yet in focus. Not for pure restyles, resets or undo.

## Offline parity: the keyword fallback

The local OpenAI pilot tests presentation proposals during development. It sends only a fixed vocabulary of presentation hints and accepts only theme, layout, density and language changes. Explicit local preferences take precedence. The pilot uses the same plan validator as the fallback and the public build keeps the offline path. The separate agent harness opens from the public results at `/harness`. Both provider routes require a development server, a loopback host and socket peer, and a browser POST from the same origin. The harness reads up to 16 KiB locally and projects the current message into recognized intent and presentation labels, catalog references and a budget-present flag. Shopper messages, conversation history and free-text searches stay off the provider request. Production and preview use the offline interpreter.

The keyword fallback answers whenever the AI cannot: no key, forced offline, an error, a timeout, or unusable output. It produces exactly the same kind of answer as the AI, so everything after "Understand" is identical online and offline.

- It recognises categories, styles, languages, spec interests ("battery", "light"), budgets, deal requests, persona phrases, reset, undo and questions, in Thai and English.
- Budgets are read carefully: "งบ 1000", "within 800", "1.5k", "2 พัน" are prices; "65W", "2 ลิตร", "70 grams", "3 วัน" and "below 5 stars" are not; "ไม่ต่ำกว่า 500" means *at least*, so it sets no cap.
- It composes pages too: "compare" or "top 3" leads with a comparison and reviews; "gift" or "review" leads with picks and reviews; a "best value page" leads with picks and the deal; "share" adds the share section; mom phrasing uses the mom persona's page.
- A question about something the listing does not cover (waterproof, IPX) answers "I can't confirm that from the listing".
- Replies are fixed templates, so it can never leak a fact.
- Every offline reply carries an "Offline mode" badge, and X-ray names the reason.

The fallback is intentionally a bounded keyword table. It covers the current bilingual golden set, including conversational phrasing such as "จอยๆ" and "ไม่เอาแพง"; unfamiliar wording can still receive a help template. The accuracy scoreboard measures the unchanged shopper messages. Listing questions restrict citations to the named category and decline when the available evidence does not match.

## Product questions

A question ("does the battery last all day?", "นั่งเครื่องบินนานๆ ได้ไหม") never changes the store. The AI may answer only by **citing** the listing: a spec, a review or the summary of a product it was shown. The citations, not the AI's sentence, carry the information: the store prints each cited spec value from the catalog. Citations to products the AI was not shown, or to specs or reviews that do not exist, are dropped. With no valid citation the answer is "I can't confirm that from the listing". The fact guard still applies to the sentence itself.

## Deals

A deal request prices "this": the products the AI named, else the product in focus, else the cart. With nothing to price, the store asks which product the shopper means. Pricing always goes through one optimizer (see [PRICING.md](PRICING.md)), whether the deal appears in chat or as a page section, so the same basket always gets the same price.

## Where state lives

- **Catalog server state only.** Local SQLite and cloud D1 persist sourced observations through explicit imports. The read-only catalog API does not store shopper accounts, interview answers or cross-device preferences; agents have no catalog write path.
- **The browser holds the store:** the plan, undo history, conversation, cart and recently viewed products. Only the plan and the cart are saved between visits, as a convenience. A saved store that differs from the standard one explains itself on return ("Restored your saved store", with the differences).
- **Debug switches are never saved:** X-ray open, force offline and the armed poisoned model reset on reload.
- **Time-dependent facts wait for the clock:** voucher expiry depends on "now", so anything that depends on it appears only once the page knows the time, and the clock refreshes every minute.
- **The coin balance is one shared simulated constant**, used by chat deals and the page alike.

## Trust boundaries

Every input from outside the system's own logic is treated as untrusted and validated where it enters.

| Input | Treatment |
| --- | --- |
| A chat request | Size cap, shape check, limits on message length, cart, focus and viewed lists. Unrecognized fields, including legacy history, are discarded |
| The AI's output | Field-by-field validation, catalog-only ids, citation checks, the fact guard, the search-phrase probe |
| The AI's tool arguments | Read leniently; anything unknown is ignored rather than trusted |
| A shared link | Length cap, strict decoding, the same validation as an AI change, ignored silently if invalid |
| Saved browser state | Each part validated on its own; a corrupt part falls back to its default |
| Debug inputs | "Force offline" always allowed (it only removes the AI); "poisoned model" ignored outside development |

Credentials never leave the server. The only configuration value the shopper can ever see is the name of the AI model, in X-ray.

## How the system degrades

| Failure | What the shopper sees |
| --- | --- |
| No AI key | Offline mode replies; everything works |
| AI error, timeout or junk | Offline mode reply for that message; X-ray names the reason |
| AI proposes something partly invalid | The valid part applies; X-ray lists what was dropped |
| AI reply states a fact | A safe template reply; X-ray shows "replaced" |
| Network failure | A clearly marked error message; the failed turn is not sent again as history |
| Saved state unreadable | The standard store |
| Filters match nothing | An empty state that names the filters and offers "Clear filters" |

## Measuring understanding

A **golden set** of about sixty real shopper messages (Thai, English, code-switched, slang and adversarial) is run through the real pipeline for both the AI and the fallback. A message passes when the intent and the expected plan changes match. Separately, three **safety checks** run on every answer: no fact in the reply, no plan value outside the allowlists, no product id outside the catalog. Any safety failure is a **fact violation**, and the target is zero. Adversarial messages are scored on safety only. The fallback's score should never be allowed to slip; the AI's score is kept alongside its typical response time and how often its output had to be trimmed or guarded. See [TRUST-AND-PROOF.md](TRUST-AND-PROOF.md).
