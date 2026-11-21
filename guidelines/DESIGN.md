# Design system: "The Thermal Receipt"

## Default marketplace exception

Accepted at the user's explicit request: the default storefront uses a familiar
orange shopping header, DynamicShopper identity, search, category controls and a
photo grid. This styling is scoped to `event-demo`; personalized receipt themes
retain their existing tokens and proof surfaces. No Shopee mark, invented
promotion, urgency or shopping fact is added. Header orange `#ee4d2d` carries only
large bold white brand text; the darker action/price ink `#b5321a` supports normal
text on white. The interview entry remains a compact optional strip.

## Interview transition

The default marketplace has a plain optional needs interview. OpenAI asks a natural
sequence of follow-up questions in a chat-style sheet, one at a time. On completion,
the fixed validator applies one proposal, closes the sheet and focuses the change
receipt. Drafts and cancellation leave the store unchanged. Undo restores the plan
and answers; chat refines the same view. There is no separate preview or Apply screen
and no preset, persona or theme chooser in the main shopping flow. Desktop centers
the dialog; phones use a bottom sheet. Large print keeps 20px text and 48px targets,
with no motion when reduced motion is requested.

## Preset inspection library

`/presets` is a separate design-review surface containing the reference's exact 177
modules across twelve parts and twenty authored presentation examples. Each module
shows its need, trigger, information order, dependency and default/empty/loading/error
states. Missing services show neutral unavailable anatomy. No example can apply to
the store. Existing catalog fixtures and the optimizer support inspection until the
updated sourced catalog arrives; original photographs are explicitly pending rather
than substituted with category illustrations. This surface keeps the orange shopping
identity, DynamicShopper wordmark, receipt proof surfaces and all four accessible
themes. See [the module inventory](../docs/PRESETS.md).

## North star

> The store may rearrange itself; every number prints like a receipt you can check.

The world is a Thai convenience-store thermal slip: warm off-white paper, carbon-black ink, hairline seams where panels meet, and figures set in a tabular monospace so columns of baht line up like a till roll. Nothing is lifted, glossy or graded. Hierarchy comes from **scale contrast** (a large printed price over small muted labels) and from **rules** (dashed, dotted and heavy ink lines), not from fills or depth.

The density is calm and even: a header strip, underline category tabs, a row of what the shopper asked for, then the shelf. When the AI changes the store, the change prints in as a slip with a torn edge, and a green stamp appears only where a real check ran.

The system deliberately refuses the orange marketplace grid with badges, banners, countdowns and shouty sale chrome. Trust is the product, and the look should feel like a receipt, not an advert.

**Story:** the shopper sees a calm shop, chats, watches the shelves rearrange, and reads a printed slip of exactly what changed and what they will pay, then believes the numbers.

### Key characteristics

- Paper ground, carbon ink, hairline seams; no shadows, no gradients.
- Every price, spec, rating and deal number is set in tabular mono and comes from the catalog.
- Green and red mean state, never decoration.
- Receipt slips with torn zig-zag edges and dotted leaders are the signature.
- One Thai-capable grotesk for all words, in both languages.

## Colour

A near-monochrome receipt palette: ink on paper, two state inks, and, in one theme, a carbon-copy blue.

| Name              | Hex       | Role                                                                                                                                                |
| ----------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thermal Paper     | `#fbfbf8` | Page ground (standard, vibrant, large print)                                                                                                        |
| Slip White        | `#ffffff` | Cards, slips, inputs, secondary buttons; minimal's page ground                                                                                      |
| Carbon Ink        | `#16161a` | Text, primary buttons, the shopper's chat bubble, input borders, heavy rules, active tab underline; the accent in standard, minimal and large print |
| Faded Ink         | `#5d5d63` | Secondary text, inactive tabs, labels, review quotes                                                                                                |
| Paper Seam        | `#e9e6dc` | Every hairline border, card and chip outlines, slip outlines, scrollbars, the art tile behind product glyphs                                        |
| Verified Green    | `#0f7b4a` | Applied vouchers, the savings line, the verification stamp. Nothing else                                                                            |
| Void Red          | `#d1263b` | Expired vouchers, the struck original price, "Expires soon", error borders. Nothing else                                                            |
| Minimal Seam      | `#ecebe6` | Minimal theme's fainter seams                                                                                                                       |
| Carbon-Copy Blue  | `#2f3ccf` | Vibrant theme's accent only. Chosen because it is neither state colour                                                                              |
| Carbon-Copy Muted | `#4f5068` | Vibrant theme's secondary text                                                                                                                      |
| Carbon-Copy Seam  | `#e3e3ef` | Vibrant theme's seams                                                                                                                               |
| Large-Print Ink   | `#0d0d10` | Large print's darker text                                                                                                                           |
| Large-Print Muted | `#3d3d42` | Large print's secondary text                                                                                                                        |
| Large-Print Seam  | `#858172` | Large print's seams, dark enough to see (3:1 against paper)                                                                                         |
| Large-Print Green | `#0b6b3f` | Large print's state green                                                                                                                           |
| Large-Print Red   | `#b01e31` | Large print's state red                                                                                                                             |

### Rules

- **State only.** Green means verified or applied; red means void, expired or error. If a use of green or red does not name a state, it is wrong. Discounts, sale prices and urgency are never tinted for excitement; a discount amount stays ink.
- **Every theme passes.** Text, secondary text, green and red reach at least 4.5:1 on both the page and card surfaces in every theme; seams in large print reach at least 3:1; product glyphs reach 3:1 on their tile. Any new colour is added to the contrast check.

## Themes

The four themes are token variants of one world, not separate looks.

| Token         | Standard              | Minimal   | Vibrant   | Large print           |
| ------------- | --------------------- | --------- | --------- | --------------------- |
| Page          | `#fbfbf8`             | `#ffffff` | `#fbfbf8` | `#fbfbf8`             |
| Surface       | `#ffffff`             | `#ffffff` | `#ffffff` | `#ffffff`             |
| Text          | `#16161a`             | `#16161a` | `#16161a` | `#0d0d10`             |
| Muted         | `#5d5d63`             | `#5d5d63` | `#4f5068` | `#3d3d42`             |
| Accent        | `#16161a`             | `#16161a` | `#2f3ccf` | `#16161a`             |
| On accent     | `#ffffff`             | `#ffffff` | `#ffffff` | `#ffffff`             |
| Seam          | `#e9e6dc`             | `#ecebe6` | `#e3e3ef` | `#858172`             |
| Green / Red   | `#0f7b4a` / `#d1263b` | same      | same      | `#0b6b3f` / `#b01e31` |
| Corner radius | 4px                   | 0         | 6px       | 6px                   |
| Base text     | 16px                  | 16px      | 16px      | 20px                  |
| Smallest text | 12px                  | 12px      | 12px      | 20px                  |
| Tap target    | 44px                  | 44px      | 44px      | 48px                  |

Character: **standard** is paper and seams with 4px corners; **minimal** is white paper, fainter seams, square corners; **vibrant** is the carbon-copy blue accent with 6px corners; **large print** has darker ink and seams, a 20px floor and 48px targets.

Density sets card padding: compact 0.5rem, comfortable 0.875rem, spacious 1.25rem; gaps inside a card are three quarters of the padding.

The whole page canvas, including overscroll, follows the active theme's page colour.

## Typography

- **Words:** IBM Plex Sans Thai, a sober, engineered grotesk that sets Thai and Latin at one weight and colour. No display face.
- **Figures:** IBM Plex Mono with tabular figures, falling back to Plex Sans Thai for Thai words such as "บาท". It makes every figure look printed and lines columns up.

All sizes derive from the theme's base (16px, or 20px in large print), and nested text never compounds. No visible text falls below the theme's floor.

| Style    | Face                                    | Size (× base) | Use                                                                  |
| -------- | --------------------------------------- | ------------- | -------------------------------------------------------------------- |
| Price    | Mono 700, tight tracking, line-height 1 | 2.125         | The headline price on a card. The biggest thing on the shelf         |
| Total    | Mono 700                                | 1.5           | The TOTAL row of a deal receipt                                      |
| Wordmark | Sans 700, tight tracking                | 1.25          | "DynamicShopper" in the header only                                  |
| Title    | Sans 600, snug, balanced                | 1.125         | Product names, chat and empty-state headings                         |
| Body     | Sans 400                                | 1             | UI copy, chat, review quotes                                         |
| Figure   | Mono 400, tabular                       | 0.875         | Receipt rows, specs, ratings, table numbers, right-aligned in tables |
| Label    | Sans 600, uppercase, 0.05em tracking    | 0.75          | Table column heads and receipt titles only                           |

### Rules

- **Printed figures.** Every price, spec, rating and deal number is a checkable fact set in tabular mono. A figure in the sans face, or a number typed into copy, is a defect.
- **Scale contrast.** Hierarchy is price large, labels small. No display face, coloured headings or weight stunts.

## Layout

- **Desktop:** two columns. The shop on the left with 32px side gutters; chat docked right at 384px, sticky and full height, separated by one seam.
- **Phones (below 1024px):** 16px gutters. Chat becomes a bottom sheet (80% of the viewport height) with a 2px ink top edge, behind a fixed pill button; the shop reserves bottom space of one tap target plus 2rem.
- **Header:** one wrapping row (wordmark, search, links and buttons) at least 68px tall on desktop, over a seam and a horizontally scrollable row of underline tabs.
- **Preferences row:** chips wrap in their own group; persona picker, Undo and Reset stay in a fixed group on the same row from 640px, below it on phones.
- **Tap targets:** 44px in every theme and 48px in large print, including chips and text buttons.
- **Comparison table:** compared items at one exact scale; number columns right-aligned; every cell shares the product name's first baseline, so an opened explanation grows the row downward without moving figures; the table scrolls inside its own container, never the page.
- **X-ray drawer:** a drawer, not a third column. 320px wide on desktop, under the preferences row, pinned to the top on scroll, with a 1px ink left edge because it floats; a 75%-height bottom sheet with a 2px ink top edge on phones.
- **Breakpoints:** 640px (small) and 1024px (large).
- No horizontal page scroll at 1440×900 or 390×844.

## Elevation and depth

The system is flat. There are **no shadows anywhere**, including popovers and the phone sheet. Depth is drawn with lines:

- a 1px seam separates panels;
- a 1px ink border marks the few things that float or take input (cart popover, search and chat inputs, empty state);
- a 2px ink rule marks the strongest divisions (table head, deal TOTAL, phone sheet top, section headings).

**The hairline rule:** if something needs to stand apart, give it a seam or an ink border, never a shadow or a gradient.

## Shapes and lines

- Corners follow the theme radius. Pills only for chips and suggestions. Small printed tags (the Mall tag, the stamp) use 3px.
- Dashed ink rules frame a card's price strip and voucher names.
- Dotted leaders (2px dotted, faded ink at 40%) join every receipt label to its figure. Short Thai labels never break; the value wraps instead.
- Receipt slips end in a torn zig-zag edge with 6px teeth, outlined by a 1px seam.
- Product art is a flat seam-coloured tile with a solid glyph in the theme accent (ink, or blue in vibrant). Tiles carry no per-product hue, because a green or red tile would read as state. In large print the tile keeps the standard seam tone.
- Icons (star, ×, chevron, check) are drawn, never Unicode glyphs.

## Components

### Buttons

Plain, heavy and printed; they press rather than glow.

- **Primary** (Add to cart, Send, Clear filters): accent fill, on-accent text, semibold, 16px horizontal padding, full tap height. Hover drops the fill to 85%; pressing nudges it down 1px.
- **Secondary** (Search, Best price, Undo, Reset, language, Cart, Copy link): white with a seam border and ink text. Hover turns the border ink.
- **Text** (actions in table rows): underlined ink text at tap height; hover takes the accent.
- **Disabled:** 45% opacity, not-allowed cursor, no hover change.
- **Focus:** a 2px accent outline offset by 2px on every focusable element.

### Chips

Pill, white, seam border, small text, tap height. Removable chips end in a drawn × in faded ink. Hover turns the border ink. Suggestions in chat use the same pill and wrap.

### Marketplace quick filters

Home categories and search-result category, shipping and capacity chips use the
same small text, theme radius, tap height and horizontal padding. Unselected
labels use muted ink; selected toggles use bold accent ink and an accent border.
The search strip keeps the home row's column gap, with the existing compact phone
row spacing and shelf-preserving collapse. Its pinned Filters action stays a
separate white control. These rules also apply to the skincare single-row strip.

### Category tabs

Toggle buttons with faded text and a transparent 3px bottom border; hover inks the text; the pressed tab is semibold ink with an accent underline.

### Inputs

White, 1px ink border, theme radius, tap height; the caret is the accent; placeholders are faded ink.

### Product card

Theme radius, white on paper, 1px seam border, no shadow. The art tile runs full-bleed at the top (about 120px tall in a grid) or on the left (list). Contents in order: name (Title), price (Price), the receipt strip between dashed rules with Price / Was (struck in red) / Shipping on dotted leaders, the rating line with a drawn star, the shop with an optional Mall tag, then Add to cart and Best price side by side.

Adaptive cards keep the catalog name and Best price action available. Between them, the validated ordered card-field subset controls every optional block, including the image. Omitted blocks leave no label, blank image tile or reserved space. Grid, list and Top picks share this card component and inherit theme and density tokens. In list layout each card spans the shelf width; its illustration is bounded so large-print text stays easy to scan.

The specs block leads with highlighted catalog keys, then the remaining available keys without duplication. The rating block includes the catalog rating, review count and units sold. Reviews show the available catalog excerpts. The voucher block is a plain receipt fragment showing only vouchers chosen by the shared optimizer for that product and the shared store clock; it waits for that clock before appearing. Coupon codes and amounts carry pricing fact metadata. The unchanged initial photographic shelf remains the default before adaptation.

### Receipt slip (signature)

The proof surface: What changed, the deal, citations, the facts check, a restored or shared store.

- A white panel with a 1px seam outline and a torn zig-zag bottom edge.
- A small uppercase faded title row, with an optional stamp on the right.
- Rows of label, dotted leader and mono figure.
- It **prints in** once: a 260ms clip-and-drop on an exponential ease-out. No animation under reduced motion.
- Deal slips add a fixed mark cell per voucher: **filled green** = applied, **hollow ink** = open or not met, **dashed red with a struck name** = expired. The TOTAL row uses the Total style over a 2px ink rule; savings print in green.
- Facts-check slips are capped at about 28rem wide, like a till receipt, so the stamp sits near its title.

### Stamp

A green, slightly rotated (−2°), 1.5px-bordered mono tag with a drawn check before its text: "Calculated from catalog", "N facts re-checked against the catalog", "Facts identical (N checked)". It is the only device that claims verification.

**The honest-stamp rule:** a stamp appears only where a check actually ran and passed. The What-changed slip carries no stamp.

### "Why this order?" panel

A dashed-ink box titled "Biggest reasons first", one row per reason: the label, then an unlabelled ink bar in one of four widths (full, three quarters, half, quarter). No digits anywhere in it. Compact enough to open inside a table row.

### Section headings

Semibold, slightly larger than body, underlined by a 2px ink rule, like a receipt section break.

### Chat

Assistant messages sit on the paper as plain text and slips. The shopper's message is a right-aligned accent bubble at most 85% wide. The waiting line pulses only when motion is allowed. Error messages have a red border.

Keep **Compare views** visible beside the **Shopper views** disclosure. Collapsing the presets keeps the product shelf closer to the top on phones. When the presets are open, the next tab reaches the first preset. Escape closes the disclosure and returns focus to its trigger. Undo, Reset, and X-ray use quieter buttons with the same target sizes. The public storefront link scrolls to and focuses the assistant section. Voucher expiry updates an open receipt in place and announces the changed content politely.

## Motion

- **Receipt print:** 260ms, exponential ease-out (clip reveal plus a 0.5rem drop). Once, on appearance.
- **State colours:** about 150ms colour transitions on hover.
- **Reduced motion:** nothing animates at all.

## Do

- Print every price, spec, rating and deal number as a checkable fact in tabular mono.
- Set colour through theme tokens so all four themes stay variants of one world.
- Join receipt labels to figures with a dotted leader; keep short Thai labels unbroken.
- Keep large-print text at 20px or more and every target at 48px or more.
- Keep every theme WCAG AA, and add any new colour to the contrast check.
- Print new proof surfaces as receipt slips.

## Don't

- Use green or red for anything but state: no red sale prices, no green promos.
- Add shadows, gradients or glossy fills.
- Stamp a slip unless a check ran on it.
- Add marketplace chrome: badges, banners, countdown urgency, orange sale styling, or any Shopee mark.
- Use Unicode glyphs for icons.
- Animate anything under reduced motion.

## Storefront entry point

The default storefront at `/` follows the approved Shopee Thailand mobile screenshots for the sticky search row and horizontally scrollable quick filters, sort tabs, and two-column grid. The filter drawer is based on the earlier Shopee reference. It uses the same simulated catalog as the standard storefront, with locally bundled illustrative product photos in its cards. The Thermal Receipt storefront remains available at `/?view=receipt`.

The product detail route uses a square product illustration, with the same locally bundled scene used for the one-button cooker in the grid, a catalog-backed price and shipping summary, and a specification slip opened from the bottom action bar. On phones the illustration is full width, the back, search and language controls stay visible while scrolling, and specifications open as a bottom sheet. On desktop the illustration and details sit side by side.

Below the price and delivery summary, the product route shows available catalog review excerpts, the seller, and product details. The bottom action bar links to reviews and product details and opens the specification sheet when that data exists.

The event demo uses locally bundled illustrative photos for rice cookers. The one-button listing has a square gallery with two views, swipe navigation, and keyboard-accessible image controls. Other illustrated cooker models use the same image on the shelf and listing.

The phone listing starts with the gallery at the top of the viewport. Navigation overlays the image and becomes a solid search row after the image scrolls away. The action bar stays at the bottom. Opening specifications shows a tall sheet with scrollable rows and a pinned confirmation button.

Rice cooker results put sorting in the search header. Two rows of catalog capacity and shopping controls collapse to one scrollable row as the shopper reads the results. The matching shop panel follows these controls. Skincare places its matching shop before the standard sort tabs. Both panels use the catalog shop rating, actual matching products and a shortcut to the seller’s inventory. The adaptive shopping assistant is reachable from the results or the cooker controls.

The one-button cooker’s blue opening photo is shared by the grid and the listing. The shop name and capacity on that photo come from the catalog. A central play button opens a silent overview made from the locally bundled photos. Closing the video restores the gallery. Each skincare item has its own locally bundled pack shot. Price, rating, units sold and shipping stay readable below each square card image.

The phone listing groups price and units sold on a single row, followed by available capacity and warranty, the deal action, product name and delivery. The reviews section groups rating and review count and lets shoppers search catalog excerpts. Its image strip is explicitly labeled as listing photography. Each thumbnail jumps to its corresponding illustration in the description. A horizontal shelf leads to other products from the same catalog shop. The inline Attributes row and bottom action open the same specifications sheet. On long pages the back-to-top control returns focus to the header. The one-button cooker's illustrated description begins with its catalog name and summary over a portrait photo, followed by a two-column set of labeled specification diagrams, the capacity photo and the front-switch photo. It ends with the catalog summary and text specification rows. Other items use text specification rows.

Product sharing is available in the header and in a short strip above the phone action bar while reading details. The shared link contains the canonical product ID, language and theme. Native sharing falls back to copying the link, with a selectable link if clipboard access is unavailable. The back-to-top control clears both bottom bars. Pending sharing work ends when the listing changes.

The specification sheet includes the catalog product name, seller, category specifications and listing summary. Words use Plex Sans Thai, and numeric values use Plex Mono. The scrollable content has a keyboard focus target and the confirmation button stays visible. The phone action bar gives half its width to Specifications and a quarter to each supporting action.

Search cards group the delivery amount and seller on one metadata row. The matching-shop panel uses shorter vertical spacing so the first row of square product photos begins higher in the viewport.

The storefront header includes the language switch on phones and laptops. Shoppers can choose Thai or English before searching or starting the interview.

Skincare results lead with the shop panel, sort tabs and a single row of working quick controls, beginning with Free shipping. The result heading and count remain available to assistive technology without adding another visible row. Cooker searches place the submit icon inside the leading edge of the input on phones, with full-size tap targets.

The cooker capacity panel uses a locally bundled serving scene with its catalog capacity over the image. Its review thumbnail previews the same scene. The final text separates Highlights from Product information, and each factual sentence and value still comes from the catalog.

Returning from a listing to the default storefront restores the originating search, language, filters, sort and scroll position in the same tab. Browser Back uses the storefront snapshot; the listing's Back and Search controls carry a validated selection through local navigation state. Search text never enters a shared product link. In large print on phones, the gallery's shop caption sits below the navigation controls.

The marketplace interview starts on the first question. Its progress list includes Review. Closing returns keyboard focus to the entry button. After Apply, the shelf receives focus. Chat, Edit my answers and Undo sit beside the updated products and remain visible at that handoff. A shortlist links to the first eligible ranked products, and evidence choices render catalog facts in the chosen layout. Large print uses one column of choices.

The large-print phone shop caption uses ink on a solid white backing so the lowered caption stays readable over every part of the product photo.

Shopping criteria use three compact disclosures listing active settings. Product comparison and deal calculation open on demand and return focus to their respective buttons. The comparison fits the phone viewport, labels missing catalog facts and lets shoppers choose which fields to inspect.

The digital cooker has its own locally bundled gallery and an extended illustrated description: cooking modes, serving capacity, preset timer, inner pot, heating, soup, keep-warm use, dimensions, package contents, highlights and product information. Mode icons and dimension arrows are SVG; all labels, quantities and measurements remain catalog-backed HTML. The specifications sheet includes the same optional detail facts without duplicating rows. Numeric ranges use the figure face too.

Digital review photos and silent clips are explicitly labeled as simulated examples. Their captions and association with the existing simulated review excerpts come from the catalog. Photo links jump to the corresponding description; videos play only on request, close with Escape, and return focus to their trigger. Local clips are buffered after the listing mounts so they remain playable if connectivity drops. The search card, same-shop shelf and listing use the same digital hero image. Neither these illustrations nor the expanded catalog changes pricing inputs or model context.

The phone shop caption clears the navigation and cart controls in every theme. In large print it uses ink on a solid white backing so the lowered caption stays readable over every part of the product photo.

## Direct decision help and Smart Basket

Accepted: cooker results offer explicit easy-use and comparison tasks without an
interview or chat. They preserve current eligibility and theme; an independent Undo
restores the previous decision view without mutating search, filters or cart. Easy-use
selects up to three catalog-tagged simple models ordered by program count then ID.
The comparison shows catalog price, capacity, programs and warranty, with cart actions.

Smart Basket offers at most one curated catalog-supported companion, with a cited
source review and the target skin-type fact. The current demo pairs vitamin-C serum
with ceramide moisturiser; no cooker companion is asserted. Both quotes use the same
optimizer context and coin balance. Add is explicit, rejection hides the offer for
this mounted shopping visit, and unavailable pricing or an already-owned item hides it.
The catalog remains simulated; this is not a clinical compatibility guarantee or a
new promotion. No new theme, checkout, deployment or automatic purchase is introduced.

## Brand and presentation update

The shopping header stays orange (#ee4d2d), the DynamicShopper wordmark stays
white and large/bold, and the search action stays dark orange (#b5321a) with white
foreground in every theme. Chat changes the body and product presentation only.
The root storefront passes directOnly:true to its validated interview mapping; CNN
inference is not used by this route. Existing model experiments remain archival.
The current main chat uses its bounded live adapter with offline fallback.

The digital description reads as one continuous illustrated listing. Introductory and capacity captions sit in the photographs' quiet areas; large print may place text above a photo to keep it readable. Cooking modes use large, unboxed symbols, and the preset timer uses a clock illustration. Dimension values stay beside their measurement arrows, with technical facts below. Package contents form one group. Every caption and measurement retains its catalog fact metadata. The review-photo panel leads with the catalog summary under “From the listing” and separately identifies its simulated photos.

On phone category results, a single sticky search row replaces the home masthead and keeps language selection visible beside search and sorting/filtering. The existing interview stays reachable from a compact control, without repeating its home introduction. Collapsing cooker filters keeps the product shelf in the same document position. Home, desktop and adapted receipt views retain their existing entry controls.
