# Design system: "The Thermal Receipt"

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

| Name | Hex | Role |
| --- | --- | --- |
| Thermal Paper | `#fbfbf8` | Page ground (standard, vibrant, large print) |
| Slip White | `#ffffff` | Cards, slips, inputs, secondary buttons; minimal's page ground |
| Carbon Ink | `#16161a` | Text, primary buttons, the shopper's chat bubble, input borders, heavy rules, active tab underline; the accent in standard, minimal and large print |
| Faded Ink | `#5d5d63` | Secondary text, inactive tabs, labels, review quotes |
| Paper Seam | `#e9e6dc` | Every hairline border, card and chip outlines, slip outlines, scrollbars, the art tile behind product glyphs |
| Verified Green | `#0f7b4a` | Applied vouchers, the savings line, the verification stamp. Nothing else |
| Void Red | `#d1263b` | Expired vouchers, the struck original price, "Expires soon", error borders. Nothing else |
| Minimal Seam | `#ecebe6` | Minimal theme's fainter seams |
| Carbon-Copy Blue | `#2f3ccf` | Vibrant theme's accent only. Chosen because it is neither state colour |
| Carbon-Copy Muted | `#4f5068` | Vibrant theme's secondary text |
| Carbon-Copy Seam | `#e3e3ef` | Vibrant theme's seams |
| Large-Print Ink | `#0d0d10` | Large print's darker text |
| Large-Print Muted | `#3d3d42` | Large print's secondary text |
| Large-Print Seam | `#858172` | Large print's seams, dark enough to see (3:1 against paper) |
| Large-Print Green | `#0b6b3f` | Large print's state green |
| Large-Print Red | `#b01e31` | Large print's state red |

### Rules

- **State only.** Green means verified or applied; red means void, expired or error. If a use of green or red does not name a state, it is wrong. Discounts, sale prices and urgency are never tinted for excitement; a discount amount stays ink.
- **Every theme passes.** Text, secondary text, green and red reach at least 4.5:1 on both the page and card surfaces in every theme; seams in large print reach at least 3:1; product glyphs reach 3:1 on their tile. Any new colour is added to the contrast check.

## Themes

The four themes are token variants of one world, not separate looks.

| Token | Standard | Minimal | Vibrant | Large print |
| --- | --- | --- | --- | --- |
| Page | `#fbfbf8` | `#ffffff` | `#fbfbf8` | `#fbfbf8` |
| Surface | `#ffffff` | `#ffffff` | `#ffffff` | `#ffffff` |
| Text | `#16161a` | `#16161a` | `#16161a` | `#0d0d10` |
| Muted | `#5d5d63` | `#5d5d63` | `#4f5068` | `#3d3d42` |
| Accent | `#16161a` | `#16161a` | `#2f3ccf` | `#16161a` |
| On accent | `#ffffff` | `#ffffff` | `#ffffff` | `#ffffff` |
| Seam | `#e9e6dc` | `#ecebe6` | `#e3e3ef` | `#858172` |
| Green / Red | `#0f7b4a` / `#d1263b` | same | same | `#0b6b3f` / `#b01e31` |
| Corner radius | 4px | 0 | 6px | 6px |
| Base text | 16px | 16px | 16px | 20px |
| Smallest text | 12px | 12px | 12px | 20px |
| Tap target | 44px | 44px | 44px | 48px |

Character: **standard** is paper and seams with 4px corners; **minimal** is white paper, fainter seams, square corners; **vibrant** is the carbon-copy blue accent with 6px corners; **large print** has darker ink and seams, a 20px floor and 48px targets.

Density sets card padding: compact 0.5rem, comfortable 0.875rem, spacious 1.25rem; gaps inside a card are three quarters of the padding.

The whole page canvas, including overscroll, follows the active theme's page colour.

## Typography

- **Words:** IBM Plex Sans Thai, a sober, engineered grotesk that sets Thai and Latin at one weight and colour. No display face.
- **Figures:** IBM Plex Mono with tabular figures, falling back to Plex Sans Thai for Thai words such as "บาท". It makes every figure look printed and lines columns up.

All sizes derive from the theme's base (16px, or 20px in large print), and nested text never compounds. No visible text falls below the theme's floor.

| Style | Face | Size (× base) | Use |
| --- | --- | --- | --- |
| Price | Mono 700, tight tracking, line-height 1 | 2.125 | The headline price on a card. The biggest thing on the shelf |
| Total | Mono 700 | 1.5 | The TOTAL row of a deal receipt |
| Wordmark | Sans 700, tight tracking | 1.25 | "DynamicShopper" in the header only |
| Title | Sans 600, snug, balanced | 1.125 | Product names, chat and empty-state headings |
| Body | Sans 400 | 1 | UI copy, chat, review quotes |
| Figure | Mono 400, tabular | 0.875 | Receipt rows, specs, ratings, table numbers, right-aligned in tables |
| Label | Sans 600, uppercase, 0.05em tracking | 0.75 | Table column heads and receipt titles only |

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

### Category tabs

Toggle buttons with faded text and a transparent 3px bottom border; hover inks the text; the pressed tab is semibold ink with an accent underline.

### Inputs

White, 1px ink border, theme radius, tap height; the caret is the accent; placeholders are faded ink.

### Product card

Theme radius, white on paper, 1px seam border, no shadow. The art tile runs full-bleed at the top (about 120px tall in a grid) or on the left (list). Contents in order: name (Title), price (Price), the receipt strip between dashed rules with Price / Was (struck in red) / Shipping on dotted leaders, the rating line with a drawn star, the shop with an optional Mall tag, then Add to cart and Best price side by side.

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

Rice cooker results put sort next to the search field and pin a quick-filter strip beneath it. The results heading shows the selected sort order when it differs from relevance. Capacity choices come from the catalog and match the selected capacity exactly. The capacity filter clears when the shopper leaves rice cooker results. The filter drawer opens from the end of the strip, and the category row scrolls with the results.

The product detail route uses a square product illustration, with a locally bundled hero scene showing the same simulated one-button cooker as the grid, a catalog-backed price and shipping summary, and a specification slip opened from the action bar anchored at the bottom of the phone viewport. The price row groups the current price, previous price and sold count. Rice cooker listings preview catalog capacity and warranty before the title. On phones the illustration is full width, the back, search and language controls sit over the illustration and switch to a white search bar after the illustration scrolls out of view, and specifications open in a tall bottom sheet with a scrollable list and a pinned confirmation button. On desktop the illustration and details sit side by side.

The listing price uses bold, tightly tracked Plex Mono. The listing and specification sheet use Plex Sans Thai for the baht symbol and Thai units that Plex Mono does not cover.

The one-button cooker gallery contains two locally bundled product illustrations. The shopper can swipe between them or choose an image with the controls over the lower corner of the square frame.

The title and shipping row span the summary column, separated by hairlines. On a phone, the shipping amount sits below its label beside the truck icon. When a review excerpt is available, the rating leads its section below shipping. Other listings show the rating in the summary. The seller and product details follow, with catalog specifications also available in the sheet. The bottom action bar links to reviews and product details and opens the specification sheet when that data exists.

The seller section includes a horizontally scrollable shelf of other products from the same catalog shop, ordered by units sold. Each card links to the listing in the current language and uses the same local illustration as the storefront. The shelf disappears when there are no other items from that shop.

The details section begins with an inline specifications button when the catalog has specs. It opens the same sheet as the bottom action bar. The one-button cooker description uses separate closed and open product illustrations, captions drawn from the catalog, and the full specification list below both images.
