# Pricing

## Why pricing is a feature

Thai shoppers time purchases around sales because stacked vouchers decide the real price, and the real price is hard to work out. DynamicShopper answers "cheapest way to get this?" with an exact, legal, explained answer. The AI only recognises that the shopper is asking; it never does the maths.

## The voucher world (simulated)

| Voucher kind | How many per order | Applies to | Minimum spend checked against |
| --- | --- | --- | --- |
| Shop voucher | At most one per shop | That shop's items | That shop's subtotal |
| Platform voucher | At most one | The whole order | Items after shop vouchers |
| Shipping voucher | At most one | Shipping, up to its value | Items after shop vouchers |
| Coins | — | The amount left to pay | — |

- **Discounts** are either a fixed amount or a percentage with a maximum. Percentages are rounded **down** to whole baht and capped by their maximum and by what they apply to.
- **Order of application:** shop vouchers, then the platform voucher, then the shipping voucher, then coins.
- **Shipping** for a shop is that shop's highest shipping fee among the items bought from it; shipping fees of different shops add up.
- **Coins:** one coin is one baht, usable up to 10% of the amount payable after vouchers, from a simulated balance of 1,200 coins shared by every part of the store.
- **Expiry:** expired vouchers never apply. Vouchers expiring within 24 hours are flagged "Expires soon" in red.

## Finding the best deal

The optimizer searches the legal combinations for each shop, then the platform and shipping slots, and applies the best coin use. Equivalent offers with identical pricing effects use a stable representative. The cheapest total wins. Taking the largest shop discount first can disqualify a larger platform voucher, so the optimizer considers skipping it. A voucher set above the search bound produces no confirmed receipt. The catalog stays below that bound.

**Ties** go to the combination that uses fewer vouchers, then to a stable order, so the same basket always gives the same answer and a voucher worth nothing (a shipping voucher when shipping is already free) is never "used".

**Unused vouchers** each get a reason:

| Reason | Shown as |
| --- | --- |
| Expired | "Voucher expired", with the name struck through in red |
| Minimum spend not met | "Minimum spend not met · Spend ฿X more" |
| No eligible item in the basket | "No eligible item in basket" |
| Beaten by a better combination | "A better voucher applies" |

The most useful are shown first: the smallest "spend more" gap, then expired ones, then the rest. Two show inline; the rest fold away.

## What gets priced

- **From chat**, "this" means: the products the AI named, else the product the shopper is looking at, else the cart. With nothing to price, the assistant asks which product the shopper means.
- Quantities come from the cart; a product not in the cart counts once.
- A deal request never re-ranks or restyles the store. Otherwise asking for the cheapest way could reorder the page and move the very product being priced.
- **One pricing path.** The chat's deal, the page's Best deal section and the add-ons all go through the same optimizer with the same coin balance, so the same basket is the same price everywhere.

## "Only if you need it": add-ons that unlock a voucher

Shoppers routinely pad a basket to reach a minimum spend. The store does the sum honestly:

- Candidates are catalog products priced at ฿1,000 or less that are not already in the basket.
- For each, the optimizer prices the basket **plus** that product. The candidate is kept only when it newly unlocks a voucher that was out of reach for lack of spend or shop, and when its real extra cost (new total minus current total) is at least zero and less than its own price (otherwise there is no point).
- At most three are shown, cheapest extra cost first, each as the product name, "+฿extra" and the voucher it unlocks.
- They appear on the chat's deal receipt. The page's Best deal section leaves them out: on a page about one product, add-ons from unrelated categories read as noise.

## The receipt

The deal prints as a thermal receipt (see [DESIGN.md](DESIGN.md)): the products it priced, as links; each shop's items; each applied voucher with a filled green mark and its saving; shipping and any shipping voucher; coins; a heavy TOTAL; the savings in green; the add-ons; and the unused vouchers with hollow or struck marks and their reasons. Every figure on it is a checkable fact, and it carries the stamp "Calculated from catalog".
