# The catalog

The store sells a small, simulated catalog designed so that every story in the product can be told with it. All products, shops, reviews and vouchers are invented; none may be presented as real.

## Design of the catalog

- **33 products in 5 categories**, chosen for the three shoppers: gaming mice, earbuds and power banks for the tech buyer; rice cookers for the family and mom-mode story; skincare for the visual shopper.
- **Each product has:** a Thai and an English name, a price in whole baht (and sometimes an original price), a rating, a review count, units sold, a shipping fee, typed specs for its category, a one-line summary and two review highlights in both languages, a few tags, and four curated 0–1 scores (performance, durability, design, value) that feed ranking.
- **Each category has its own spec vocabulary**, with a display order and a direction ("higher is better" or "lower is better"). Shared specs (battery, weight) carry the same label everywhere.
- **The numbers are deliberate.** The core journey depends on them: exactly three mice under ฿1,500, with Aero X winning on battery plus light weight; rice cookers whose reviews talk about older users; earbuds tagged "waterproof" with no waterproof spec, so a question about it honestly cannot be confirmed; a voucher already expired and one about to expire, so the receipt shows every voucher state.

## Spec vocabulary

| Category | Specs (in display order; ↑ higher is better, ↓ lower is better) |
| --- | --- |
| Gaming mouse | Max DPI ↑, Weight (g) ↓, Battery life (h) ↑, Polling rate (Hz) ↑, Connection |
| Earbuds | Battery life (h) ↑, Noise cancelling, Latency (ms) ↓, Weight (g) ↓ |
| Power bank | Capacity (mAh) ↑, Max output (W) ↑, Weight (g) ↓ |
| Rice cooker | Capacity (L) ↑, Power (W) ↓, Cooking programs ↑, Warranty (yr) ↑ |
| Skincare | Volume (ml) ↑, SPF ↑, Skin type |

Connection, noise cancelling and skin type are words, so they can be shown and highlighted but not used for ranking.

## Shops

| Shop | Mall | Rating | Sells |
| --- | --- | --- | --- |
| TechHub Official Store | Yes | 4.9 | Mice, earbuds, power banks, rice cookers |
| GamerZone Thailand | No | 4.7 | Mice, earbuds, power banks |
| AudioLab Mall | Yes | 4.8 | Earbuds |
| บ้านครัว HomeKrua | No | 4.8 | Rice cookers |
| Glow Skin Official | Yes | 4.9 | Skincare |

## Vouchers

Ten simulated vouchers, covering every rule and state. Expiry is relative to the moment the store opens: most vouchers are valid, one is about to expire and one has already expired.

| Code | Kind | Shop | Discount | Minimum spend | Expiry state | State it demonstrates |
| --- | --- | --- | --- | --- | --- | --- |
| TECH100 | Shop | TechHub | ฿100 off | ฿1,000 | Valid | Fixed shop voucher |
| GAMER10 | Shop | GamerZone | 10%, up to ฿150 | ฿800 | Valid | Percentage with a cap |
| AUDIO200 | Shop | AudioLab | ฿200 off | ฿1,500 | Valid | High minimum spend (top-up target) |
| KRUA150 | Shop | HomeKrua | ฿150 off | ฿1,200 | Valid | Rice-cooker shop voucher (top-up target) |
| GLOW15 | Shop | Glow Skin | 15%, up to ฿100 | ฿500 | Valid | Skincare shop voucher |
| SAVE50 | Platform | — | ฿50 off | ฿300 | Valid | Small, easy platform voucher |
| MEGA8 | Platform | — | 8%, up to ฿300 | ฿1,000 | Expires soon | "Expires soon" |
| FLASH100 | Platform | — | ฿100 off | ฿500 | Expired | Expired: struck through, never applied |
| SHIP40 | Shipping | — | up to ฿40 off shipping | ฿300 | Valid | Shipping voucher |
| SHIP60 | Shipping | — | up to ฿60 off shipping | ฿1,500 | Valid | Shipping voucher with a high minimum |

The shopper has a simulated balance of **1,200 coins** (1 coin = ฿1, usable up to 10% of the amount payable).

## Products

Prices in baht. "Free" means free shipping.

### Gaming mice

| Product | Shop | Price | Was | Rating | Sold | Shipping | Specs |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Nova Lite 62g wireless gaming mouse | GamerZone Thailand | 1,290 | 1,590 | 4.7 | 5,200 | 40 | DPI 16,000, weight 62 g, battery 70 h, polling 1,000 Hz, 2.4GHz |
| Vortex W wireless mouse, 120h battery | TechHub Official Store | 1,190 | 1,490 | 4.6 | 8,100 | Free | DPI 12,000, weight 85 g, battery 120 h, polling 1,000 Hz, 2.4GHz + Bluetooth |
| Aero X 58g ultralight gaming mouse | GamerZone Thailand | 1,450 | — | 4.8 | 3,900 | 40 | DPI 26,000, weight 58 g, battery 95 h, polling 4,000 Hz, 2.4GHz |
| Blaze Pro RGB wireless gaming mouse | TechHub Official Store | 1,890 | 2,290 | 4.7 | 2,600 | Free | DPI 25,600, weight 74 g, battery 80 h, polling 2,000 Hz, 2.4GHz + Bluetooth |
| Titan Max 30K sensor gaming mouse | TechHub Official Store | 2,490 | — | 4.9 | 1,500 | Free | DPI 30,000, weight 63 g, battery 110 h, polling 8,000 Hz, 2.4GHz |
| Rogue O honeycomb gaming mouse 55g | GamerZone Thailand | 1,690 | 1,990 | 4.5 | 1,100 | 40 | DPI 19,000, weight 55 g, battery 60 h, polling 1,000 Hz, 2.4GHz |
| Ergo G ergonomic wireless mouse | TechHub Official Store | 1,990 | — | 4.6 | 900 | Free | DPI 8,000, weight 98 g, battery 150 h, polling 1,000 Hz, 2.4GHz + Bluetooth |
| Pixel Mini compact gaming mouse | GamerZone Thailand | 1,590 | — | 4.4 | 700 | 40 | DPI 12,000, weight 66 g, battery 85 h, polling 1,000 Hz, 2.4GHz |

### Earbuds

| Product | Shop | Price | Was | Rating | Sold | Shipping | Specs |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| QuietBuds Pro ANC earbuds | AudioLab Mall | 2,490 | 3,290 | 4.8 | 9,800 | Free | battery 36 h, hybrid ANC, latency 60 ms, weight 5 g |
| PlayLite low-latency gaming earbuds | AudioLab Mall | 790 | 1,190 | 4.5 | 12,400 | 30 | battery 30 h, no ANC, latency 40 ms, weight 4 g |
| SportFit IPX5 sweatproof earbuds | GamerZone Thailand | 990 | — | 4.4 | 4,300 | 30 | battery 28 h, no ANC, latency 80 ms, weight 6 g |
| Studio X Hi-Res earbuds | AudioLab Mall | 3,490 | — | 4.9 | 1,400 | Free | battery 32 h, hybrid ANC, latency 70 ms, weight 5.5 g |
| DailyMini tiny Bluetooth earbuds | TechHub Official Store | 590 | — | 4.3 | 21,000 | 30 | battery 24 h, no ANC, latency 90 ms, weight 3.5 g |
| Neo ANC earbuds, 40h battery | TechHub Official Store | 1,590 | 1,990 | 4.6 | 6,100 | Free | battery 40 h, hybrid ANC, latency 75 ms, weight 5 g |
| ClearCall earbuds with noise-reducing mic | AudioLab Mall | 1,290 | — | 4.5 | 2,200 | 30 | battery 26 h, no ANC, latency 85 ms, weight 4.5 g |

### Power banks

| Product | Shop | Price | Was | Rating | Sold | Shipping | Specs |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| SlimCharge 10000mAh slim power bank | TechHub Official Store | 490 | 690 | 4.7 | 25,000 | Free | 10,000 mAh, output 22.5 W, weight 190 g |
| FastPD 20000mAh 65W laptop power bank | TechHub Official Store | 1,490 | 1,890 | 4.8 | 7,400 | Free | 20,000 mAh, output 65 W, weight 420 g |
| MagGo 5000mAh magnetic power bank | GamerZone Thailand | 790 | — | 4.4 | 3,600 | 30 | 5,000 mAh, output 15 W, weight 125 g |
| MegaPower 30000mAh travel power bank | TechHub Official Store | 1,190 | — | 4.6 | 4,100 | Free | 30,000 mAh, output 45 W, weight 590 g |
| EcoBank 10000mAh budget power bank | GamerZone Thailand | 299 | — | 4.2 | 41,000 | 30 | 10,000 mAh, output 10 W, weight 230 g |
| SolarTrek 20000mAh solar waterproof power bank | GamerZone Thailand | 890 | — | 4.3 | 1,300 | 30 | 20,000 mAh, output 18 W, weight 380 g |

### Rice cookers

| Product | Shop | Price | Was | Rating | Sold | Shipping | Specs |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1.8L one-button electric rice cooker | บ้านครัว HomeKrua | 690 | 890 | 4.8 | 32,000 | 50 | 1.8 L, power 700 W, programs 2, warranty 2 yr |
| 2 L digital rice cooker with 9 programs | บ้านครัว HomeKrua | 1,290 | — | 4.7 | 9,200 | 50 | 2 L, power 450 W, programs 9, warranty 3 yr |
| 2.2L family rice cooker, 3-year warranty | บ้านครัว HomeKrua | 1,590 | 1,990 | 4.8 | 5,300 | Free | 2.2 L, power 900 W, programs 4, warranty 3 yr |
| 0.8L mini rice cooker for 1-2 people | TechHub Official Store | 450 | — | 4.5 | 18,000 | 50 | 0.8 L, power 350 W, programs 2, warranty 1 yr |
| 1.5L IH rice cooker, restaurant-quality rice | TechHub Official Store | 3,290 | 3,990 | 4.9 | 1,800 | Free | 1.5 L, power 1,000 W, programs 12, warranty 5 yr |
| 1.8L rice cooker with steamer tray | บ้านครัว HomeKrua | 890 | — | 4.6 | 11,000 | 50 | 1.8 L, power 750 W, programs 3, warranty 2 yr |

#### Digital rice cooker listing details

The simulated `cooker-digital` listing adds model DS-D2, 220–240 V, a preset timer up to 24 h, a non-stick inner pot, 360° heating, automatic keep-warm and overheat protection with a 3 s warning. It measures 20 cm wide, 24.5 cm deep and 21 cm high and weighs 1.7 kg.

Its modes are boil, quick cook, steam, porridge, soup, stew, yogurt, cake and keep warm. The box contains the cooker, inner pot, rice paddle, measuring cup, power cord and manual. Review images are illustrative and carry a simulated-media caption in both languages.

Capacity and program count use the category specs. The extended listing uses bilingual `detail.*` fields resolved by exact key for this product. These fields are for the listing renderer and fact verifier. The model's listing context and supported citation fields continue to use the category specs, summary and reviews.

### Skincare

| Product | Shop | Price | Was | Rating | Sold | Shipping | Specs |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| SPF50+ PA++++ lightweight sunscreen | Glow Skin Official | 359 | 490 | 4.8 | 56,000 | Free | 50 ml, SPF 50, All skin |
| 15% Vitamin C brightening serum | Glow Skin Official | 590 | — | 4.7 | 24,000 | Free | 30 ml, SPF 0, All skin |
| Oil-control cleansing gel for oily, acne-prone skin | Glow Skin Official | 189 | — | 4.6 | 38,000 | 30 | 150 ml, SPF 0, Oily |
| Ceramide moisturiser for dry skin, 24h hydration | Glow Skin Official | 450 | 590 | 4.7 | 15,000 | 30 | 75 ml, SPF 0, Dry |
| SPF35 gentle sunscreen for sensitive skin | Glow Skin Official | 420 | — | 4.7 | 9,000 | 30 | 40 ml, SPF 35, Sensitive |
| Hyaluronic sheet masks, 10 pack | Glow Skin Official | 249 | 349 | 4.5 | 29,000 | 30 | 250 ml, SPF 0, All skin |

## Products that carry the stories

| Story | Products and why |
| --- | --- |
| "Battery and light weight, under 1500" | Nova Lite, Vortex W and Aero X are the only mice under ฿1,500. Aero X ranks first: the lightest of the three with a long battery, and the strongest sensor. |
| A question the listing can answer | Vortex W's battery life (120 h) and its review "One charge a month is enough" |
| A question the listing cannot answer | SportFit is tagged waterproof and named IPX5, but has no waterproof spec, so "is it waterproof?" gets "I can't confirm that from the listing" |
| Mom mode and the gift page | 1.8L one-button rice cooker ("Mom uses it without help"), 2.2L family rice cooker ("Large buttons suit seniors"), digital and steamer models |
| Best deal and top-ups | HomeKrua's ฿1,200 minimum and AudioLab's ฿1,500 minimum sit just above single-product prices, so a cheap add-on can unlock them |
| Compare views | Every category renders differently for Tech minimal (spec table) and Visual vibrant (picks and reviews) with identical facts |

## Rules for the catalog

- Every product has Thai and English text for its name, summary and reviews.
- Every product uses only the spec keys of its category, and has all of them.
- Prices are positive whole baht; an original price, when present, is higher than the price.
- Scores are between 0 and 1; ratings between 0 and 5.
- Product imagery uses category glyphs and illustrative cooker media. Review imagery carries a simulation disclosure.
