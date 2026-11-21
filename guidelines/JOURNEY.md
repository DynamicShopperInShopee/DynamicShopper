# The core journey

One walk through the product that touches every idea in these guidelines. It is the reference experience: every part of the product should make this journey work, with or without the network.

Open **Shopping assistant** from the results heading on `/`, or go directly to `/?view=receipt`. The browser demo uses the offline assistant by default. To rehearse the local live-model proof or development-only poisoned model, use the loopback setup in the [README](../README.md#optional-local-openai-test).

A cooker capacity selected on the public storefront stays active when the shopper opens **Shopping assistant**, restyles the shelf, or opens **Compare views**. Both views use the same capacity and shipping filters. The shopper can remove the capacity chip or reset the store, then use Undo to restore it. Choosing a new category clears the cooker capacity and any incompatible cooker search.

After applying an interview, opening a listing and returning with browser Back, Back to store or Search products restores the accepted view, its filters and Undo history in the same tab. Shared listing links carry only listing information.

## The arc

1. **It adapts.** The store reshapes from a Thai sentence, then ranks by what the shopper cares about.
2. **It explains.** Every change is named, the order explains itself, questions are answered from the listing.
3. **It composes.** The AI builds a different page for a different need: a gift for mom, a comparison for a gym buyer.
4. **It is exact.** The real lowest price, worked out from vouchers and coins.
5. **It cannot lie.** Two shoppers, two stores, identical facts; a hijacked model that changes nothing; a store that keeps working offline; zero fact violations.

## The steps

| # | The shopper does | The store shows | The idea |
| --- | --- | --- | --- |
| 1 | Searches "gaming mouse" | Only gaming mice in the standard store; the facts receipt stamps "N facts re-checked against the catalog" | A normal, calm store that checks itself |
| 2 | Opens X-ray, types "ขอแบบเรียบๆ ดูสเปกก่อน" | The store turns minimal with a spec-first table; "What changed" lists the changes; X-ray shows the pipeline | The AI returns a validated change to the plan, nothing else, and the prices do not move |
| 3 | "I care about battery and light weight, under 1500 baht", then "Why this order?" on the top mouse | Three mice left, Aero X first, a chip "Under ฿1,500"; the explanation shows the top reasons as bars, no numbers | Ranking is deterministic logic over facts, and it explains itself with no AI involved |
| 4 | "does the battery last all day?" | A short reply and a "From the listing" receipt of spec rows; the store does not change | Questions never change the store; answers can only point at the listing |
| 5 | "ซื้อของขวัญให้แม่ หม้อหุงข้าว ใช้ง่ายๆ" | A large-print Thai page: Top picks (three rice cookers), What matters, Best deal, Share with family. With the AI, X-ray shows its steps ("Searched catalog: rice cooker", "Read 3 listings") | The AI composes the page: which sections, in which order, each one fact-locked. The share link carries only the look |
| 6 | Resets, then "earbuds for the gym, compare the top 3" | Compare top 3 first, then What buyers say, then the remaining earbuds | A different need, a different page shape |
| 7 | "cheapest way to get this?" | The best-deal receipt: shop voucher, platform voucher, coins, the real total, savings, and "Only if you need it" add-ons with their exact extra cost; the ranking does not move | Voucher stacking is exact maths, never guessed |
| 8 | Opens "Compare views" | Tech minimal and Visual vibrant side by side, different shapes, and a stamp "Facts identical (N checked)" read from both panes | Two shoppers, two stores, one set of facts, checked on screen |
| 9 | In X-ray, arms "Simulate poisoned model" and sends any message; then ticks "Force offline" and sends another | Dropped parts listed, fact guard "replaced", plan "no change", prices untouched; then an "Offline mode" reply that still restyles the store | A hijacked model fails; losing the network or the key does not break the store |
| 10 | Looks at the Accuracy slip in X-ray | Fallback accuracy, the AI's score, zero fact violations, the size of the golden set | Measured, not claimed. The fallback misses slang, which is exactly what the AI is for |

Three of these messages are offered as suggestion chips in the empty chat, so the journey can be followed by clicking.

## Ways back when a step does not land

The product always offers a direct path to the same result:

| If | The shopper can |
| --- | --- |
| A reply does not reshape as expected | Use the matching suggestion chip, or Reset and send again |
| Mom mode does not trigger | Open **Shopper views**, pick **Mom mode**, then search "หม้อหุงข้าว" |
| The answer is "I can't confirm that from the listing" | Ask about something the listing covers, such as weight; the refusal is the honest answer |
| A deal does not appear | Press "Best price" on a card |
| The compare check says "Nothing to compare yet" | Search "rice cooker" on the compare page |
| The network or the AI is unavailable | Carry on: the store answers in Offline mode |
| The store is in a confusing state | **Reset store** restores the default shelf and clears the previous reply and deal receipt |
