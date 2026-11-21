# Reference composition refinement

**Status: accepted direction.** Continue the user's approved request to match their phone screenshots, preserving the catalog and experience rules they chose. The composition details below are implementation decisions from the current visual audit, not new product behavior.

The resumed goal remains the whole supplied reference: cooker and skincare search, the cooker gallery and summary, reviews, seller shelf, attributes sheet, illustrated description and final information. Existing functions must remain usable after every visual change. Main baseline is `084490a`.

## Evidence and approach

At a phone width of 390px, the supplied 591px-wide screenshots normalize to a roughly 366px content panel. The app already uses 364px. Its description instead puts separate caption tables above each image, leaves 28px between modules, boxes small mode icons into a table, and places dimension values away from their arrows. These differences are visible even with different simulated product names and images.

Use the existing assets and fixed catalog rows. Compose headings within image headroom, place facts beside the diagram features they describe, and join adjacent panels. This follows the reference more closely without adding another SKU, image source, unsupported claim, or decorative marketplace promotion. Replacing fonts or rasterizing captions would violate the selected typography and fact rules, so those approaches are excluded.

## Required composition

- Keep current gallery, controls, cart and listing navigation. Add the existing catalog summary inside the pale simulated-review photo panel, with a source label. Preserve review search and simulated labeling.
- Put the digital intro title about 10–12% down inside its portrait, with a separating rule and summary beneath. The supplied photo has room for this text. Use centered fact-led headings for the serving capacity and inner-pot sections.
- Remove the repeated borders and gaps between story panels. Headings remain readable, and large print may move text into normal flow when it cannot fit safely above image subjects.
- Center the program count and mode heading. Use an unboxed three-column grid with roughly 56px icons and 96px or greater row pitch on standard phones; allow large-print rows to grow.
- Use one large neutral SVG clock for the preset panel instead of repeating the gallery hero. Keep the preset value as a marked HTML fact.
- Compose heating as heading, cutaway, then warning. Keep its existing catalog facts intact.
- Put width, depth and height next to their corresponding dimension arrows; put weight and existing technical/category facts in a compact panel beneath. Render each displayed value through its existing metadata, including localized voltage and mono figures.
- Group the six package crops into a single continuous illustration with labels beneath. The count comes from the catalog; no invented quantity per item.
- Tune search proportions only where the independent search audit finds a difference. Keep interview, cart, filters, catalog facts and return navigation intact.

## Acceptance evidence

Compare before/after rendered sections against A1–A10 and B1–B8, plus the skincare search pair. Do not equate passing behavioral tests with visual similarity. Verify every changed fact on screen, both locales, four themes, phone and laptop, reduced motion, keyboard focus, image loading and offline reading. Record permitted differences (simulated assets/facts, required font, neutral proof surfaces) separately from unresolved composition gaps. Keep the goal active while any required area lacks visual evidence.
