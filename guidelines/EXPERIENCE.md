# Experience

How each part of the product behaves. The visual treatment is in [DESIGN.md](DESIGN.md).

## The storefront

The home page is one calm shop with a conversation beside it.

**Desktop (1024px and wider):** the shop on the left, the chat docked on the right as a fixed column, full height, always visible.
**Phone:** the shop fills the screen; the chat is a bottom sheet behind a floating "Chat with the assistant" button, and the page leaves room at the bottom so the button never covers content.

From top to bottom, the shop column holds:

1. **Header:** the wordmark, a search box, a "Compare views" link, the language switch (labelled with the *other* language, written in that language: "ไทย" / "English"), the X-ray button and the cart.
2. **Category tabs:** All, Gaming mouse, Earbuds, Power bank, Rice cooker, Skincare. They filter, so they act as toggles; the active one is underlined.
3. **Preferences bar:** removable chips for everything the shopper has changed, then the persona picker, Undo and Reset.
4. **Result count:** "N products", announced to screen readers when it changes.
5. **The composed page:** the plan's sections in order (see [PERSONALIZATION.md](PERSONALIZATION.md)).
6. **Facts receipt:** the self-check slip (see [TRUST-AND-PROOF.md](TRUST-AND-PROOF.md)).
7. **Footer:** "Shopee-inspired prototype. Not affiliated with Shopee."

A skip link jumps straight to the products. Navigation keeps the same structure in every theme and layout, so it never moves when the store reshapes.

### While the store is reshaping

The plan does not change until the answer arrives, so each message is exactly one undo step. Meanwhile the product area dims slightly, a small "Reshaping the store..." label appears, and the chat shows the same line (pulsing only when motion is allowed). "Best price" buttons and Send are disabled, so a second request cannot race the first.

## Product cards and layouts

A card shows the fields the plan asks for, in the plan's order:

- **Image:** a flat tile with a simple drawn glyph for the category (no photos, no per-product colour).
- **Name:** a link to the product page.
- **Price:** a large printed price, then a small receipt strip between dashed rules: Price, "Was" (struck through) when there is an original price, and Shipping ("Free" or the fee) when the plan shows shipping.
- **Rating:** a drawn star, the rating, the review count and units sold.
- **Key specs:** the category's specs, with highlighted and preferred specs first.
- **Summary:** one line in the shopper's language.
- **Reviews:** up to two quotes.
- **Vouchers:** the vouchers usable on this product (its shop's and the platform's), each with "Expires soon" when due within a day. They appear only once the page knows the time.
- **Shop:** the shop name and a small "Mall" tag for official shops.
- **Actions:** "Add to cart" and "Best price". "Why this order?" appears when ranking explanations make sense.

**Layouts:** a **grid** of cards whose column width scales with the text size (so large print gets fewer, wider cards); a **list** of wide cards with the image on the left; a **comparison table** with the product, price, rating and spec columns, numbers right-aligned, shop and shipping on a second line under the name, and compact text-style actions. With mixed categories, the table only shows spec columns the shopper cares about, so it is never mostly empty. Half-width compare panes show at most three spec columns.

**Empty state:** when nothing matches, a dashed panel says "No products match", lists the active filters and offers "Clear filters" in one click.

## Chat

- An empty conversation shows a short help line and three suggested messages, one for each kind of change: "ขอแบบเรียบๆ ดูสเปกก่อน", "I care about battery and light weight, under 1500 baht", "ซื้อของขวัญให้แม่ หม้อหุงข้าว ใช้ง่ายๆ". After the first message, suggestions not yet sent stay above the input (two at most, one in large print, none while a large-print deal receipt needs the room). They wrap and never scroll sideways.
- The input is a multi-line box: Enter sends, Shift+Enter adds a line, and Enter that confirms a Thai input-method composition never sends. Messages are capped at 1,000 characters.
- **The shopper's message** is a right-aligned filled bubble. **The assistant's reply** sits on the page as plain text, followed by whatever applies:
  - an "Offline mode" badge when the fallback answered;
  - the **"What changed"** receipt, one line per change ("Theme: Standard → Minimal", "Page sections: Top picks, What matters, …", "Ranking: Rating and durability first");
  - the **"From the listing"** citations for a question;
  - product chips linking to products the assistant mentioned (these never change what the store shows);
  - the **Best deal** receipt.
- Error replies have a red border and are announced as alerts. A failed turn is never resent as history.
- Messages appear in reading order and the newest stays in view. A reply taller than the panel (a deal receipt) is shown from its top.
- On phones, opening the chat moves focus into the input and closing it returns focus to the button. Escape closes the sheet.

## Product page

Each product has its own page, shaped by the same plan: the same theme, language and chat beside it, and the chat's focus is this product (so "does it last on a flight?" or "cheapest way to get this?" are about it).

- Top: the image, name, shop, rating, price strip, vouchers, then Add to cart and Best price.
- Below: Summary, Key specs (as a dotted-leader receipt) and Reviews, ordered by the plan: specs lead for a tech shopper, reviews for a visual one.
- On phones the "Back to the store" link shrinks to a chevron so the header stays one row.
- Visiting a product records it as recently viewed, which gives the AI light context.
- An unknown product shows a themed "Not found" receipt with a way back.

## Cart

A small popover from the header: each line with its name, price and quantity, a Remove button, and "Best price for my cart", which closes the popover (so it never covers the receipt) and asks the chat for the cheapest way to buy the whole cart. The cart holds at most 20 different products; "Add to cart" says when it is full. There is no checkout.

## Compare views

A page that answers "would two shoppers really see the same facts?":

- A header with the wordmark and "Back to the store", a title and one line of explanation.
- One search box and one row of category tabs shared by both panes. They start from the shopper's own search and category, and editing them here affects only this page.
- The facts-check slip, above the panes so its verdict is seen first.
- Two panes (side by side on desktop, stacked on phones), each with a persona picker and a full mini store in that persona's theme and page shape.

## Mom mode

The family case, designed end to end:

- Reached by saying it ("ซื้อให้แม่ อายุ 65", "I'm shopping for my mom, she's elderly", "ซื้อให้ม๊า ตัวใหญ่ๆ อ่านง่ายๆ") or by picking it.
- Large print: bigger text everywhere with a 20px floor, 48px tap targets, darker ink and seams.
- Thai, a simple list, three products only, image, price, summary and shipping on each.
- The page: Top picks, What matters (in plain words), Best deal already computed, Share with family, and no extra list because the picks already show all three.
- Sharing sends exactly this store to the parent, over LINE or as a copied link.

## X-ray

A drawer for anyone who wants to see how an answer was made (see [TRUST-AND-PROOF.md](TRUST-AND-PROOF.md) for what it shows).

- Opened from the header button, the `x` key (ignored while typing or with modifier keys) or a link; closed with its Close button, `x` or Escape, which returns focus to the header button.
- On desktop it is a narrow drawer over the right edge of the product area, under the preferences bar, pinned while scrolling. The header and chips keep their full width. Cards and lists reflow beside it; a comparison table keeps its width and gains room to scroll its covered columns into view.
- On phones it is a bottom sheet.
- It always uses the standard text size, whatever the shopper's theme, so its status chips never clip in large print.
- Its own text is English only: it is an instrument, not part of the shopping experience.

## Voice and language

- **Assistant voice:** one or two short, friendly sentences in the shopper's language. Never a number, price, percentage or spec value; the store shows those.
- **Template replies** (used offline and whenever a reply is guarded) are plain statements of what happened: "I've restyled the store to your taste.", "I've updated the products for you.", "Looking for the best deal. See the summary below.", "I've set up the store to suit you.", "The store is back to its standard look.", "I've undone the last change.", "Here's what the listing says.", and the help line suggesting what to try.
- **Honest non-answers:** "I can't confirm that from the listing." and "Which product should I find a deal for? Open one or add it to your cart first."
- **Change notes** name things the way the shopper would: themes as Standard, Minimal, Vibrant, Large print; priorities as words ("Performance and value first"), never weights.
- **Thai is not a translation layer.** Thai copy is written for Thai shoppers: short compounds ("ราคาดีที่สุด", "ดีลที่คุ้มที่สุด", "เฉพาะถ้าอยากได้เพิ่ม"), prices as "1,290 บาท" in Thai and "฿1,290" in English.
- **No brand borrowing:** "Coins", never a branded coin name; "Mall" only as a plain tag.

## States every surface must handle

| State | Behaviour |
| --- | --- |
| First visit | Standard store, empty chat with suggestions, empty cart |
| Returning visit | The saved store, explained once by "Restored your saved store" |
| Opening a shared link | The shared store, one undo step, "Shared store opened" |
| Before the clock is known | No voucher lists or deal sections yet (they depend on expiry) |
| Waiting for a reply | Dimmed products, "Reshaping…", controls that would race are disabled |
| Offline | Same experience, "Offline mode" badge on replies |
| Nothing matches | Empty state with active filters and "Clear filters" |
| Error | Red-bordered message announced as an alert; the store is untouched |

The optional interview, product comparison and deal check sit beside direct search. Requirements, Preferences and View use separate disclosures. Each group shows its current selections when closed. A shopper can correct eligibility or ranking directly and change language, layout or reading settings independently.
