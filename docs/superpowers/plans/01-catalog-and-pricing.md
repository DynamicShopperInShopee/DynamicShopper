# Catalog and pricing implementation plan

> Owner 1 uses Sol and the executing-plans workflow for scoped implementation. Use Astra with an affected consumer for shared design decisions.

**Goal** Give two shoppers an identifiable rice cooker with the same checkable price and capacity, then the same itemized receipt for identical inputs.

**Architecture and stack** Pure TypeScript modules expose immutable catalog data, a canonical fact formatter and a deterministic optimizer. Run their Vitest server tests with Bun. Scope implementation to `src/lib/catalog/` and `src/lib/pricing/`. Owner 2 consumes product identities, ranking inputs and citable fields. Owner 3 consumes facts and receipts. Owner 4 consumes the shared examples and verifies the integrated journey.

Read [the design](../specs/2026-11-21-two-shopper-design.md), [product rules](../../../AGENTS.md), [product](../../../guidelines/PRODUCT.md), [system design](../../../guidelines/SYSTEM-DESIGN.md), [catalog](../../../guidelines/CATALOG.md) and [pricing](../../../guidelines/PRICING.md). Keep listing text bilingual, money in whole baht and scoring inputs local to deterministic logic. All domain checks run without network, credentials or a database.

**Review focus.** Missing fields, locale-specific fractional specs, voucher thresholds after shop discounts, cross-shop shipping and unused-voucher ordering are covered in Tasks 2–5.

See [team setup and security](../../team-setup.md) for the toolchain and Codex skills.

### Task 1: Agree the fact and receipt examples

- [ ] From the design on `docs/two-shopper-design`, send Owner 4 the baseline inputs immediately. Use SKU `cooker-one-button`, bilingual names from the one-button listing, raw price 690, original price 890, capacity 1.8 L, shipping 50 and warranty 2 yr. Include a missing-field lookup and canonical visible strings for price and capacity in both locales.
- [ ] Supply one unit at store opening, the shared 1,200 coin balance, SAVE50 saving 50, SHIP40 saving 40, coins 65, total 585 and savings 155 against 740. Keep opening and reference time explicit so every consumer evaluates the same voucher validity.
- [ ] Agree with Owners 2 and 3 on product/field IDs, unit and raw types, locale formatting, missing lookup result, voucher reason codes and receipt line identities. Publish the public calls through the two owned module entry points: `resolveFact(productId, field)`, `formatFact(fact, locale)` and `optimizeDeal(basket, context)`. A basket carries catalog IDs and quantities, context carries the shared clock and balance, and the receipt identifies products, shops, savings, individual lines and unused reasons.
- [ ] Owner 4 publishes reviewed types in `src/lib/contracts.ts` and examples in `src/lib/fixtures/contract-sample.ts`. Record the actual reviewed baseline SHA in the draft PR. Run `git fetch origin`, then `git switch --track origin/feat/catalog-pricing` (or `git switch feat/catalog-pricing` for an existing local branch). Merge the reviewed baseline SHA before integrating implementations. All subsequent tasks import these contracts.

#### Owner 1 handoff for the shared contract PR

These are proposed contract inputs for Owners 2–4. Use the final producer/consumer-reviewed names and types in the baseline.

| Listing value | Raw value | English | Thai |
| --- | --- | --- | --- |
| `cooker-one-button`, HomeKrua | Catalog identity | 1.8L one-button electric rice cooker | หม้อหุงข้าวไฟฟ้าแบบปุ่มเดียว 1.8 ลิตร |
| `price` | 690 baht | ฿690 | 690 บาท |
| `originalPrice` | 890 baht | ฿890 | 890 บาท |
| `shipping` | 50 baht | ฿50 | 50 บาท |
| `spec.capacity` | 1.8 L | 1.8 L | 1.8 ลิตร |
| `spec.warranty` | 2 years | 2 yr | 2 ปี |

Propose `resolveFact(productId, field)` returning a fact with product and field identity, typed raw value and unit, or `undefined` for a missing record. An unknown key and an absent original price are both missing. `formatFact(fact, locale)` prints exact text for `en` or `th`. The table above gives Owner 3 fixed display assertions. Owner 2 uses stable product IDs and verified listing references. Keep prices and pricing inputs on the deterministic side.

For the anchor receipt, use a fixed opening and reference instant of `2026-11-21T03:30:00Z`, basket `[{ productId: 'cooker-one-button', quantity: 1 }]` and the 1,200-coin balance. Items 690 plus shipping 50 produces the 740 baseline. SAVE50 and SHIP40 leave 650 payable before coins. Use 65 coins for a **585 baht total** and **155 baht savings**. Original price is a catalog display fact. The receipt's savings baseline uses the current item price and original shipping charge.

The sorted unused groups are minimum gaps for MEGA8 (310), KRUA150 (510) and SHIP60 (810), then expired FLASH100, then shop-ineligible AUDIO200, GAMER10, GLOW15 and TECH100 in stable code order. Keep voucher identity in the receipt and separate machine-readable reasons from translated copy.

For the separate exact-search test, use one 1,000-baht item with free shipping, a fixed shop discount of 100 and a fixed platform discount of 200. Both require 1,000. Skipping the shop voucher qualifies the platform voucher, uses 80 coins and pays 720. Taking the shop voucher disqualifies the platform voucher, uses 90 coins and pays 810.

#### Implementation handoff

- Catalog consumers can import `products`, `getProduct`, `shops`, `getShop`, `categories`, `specs`, `vouchers`, `resolveFact` and `formatFact` from `src/lib/catalog/index.ts`. Product fact keys include `sold`, `reviewCount`, `summary`, `review.0`, `review.1` and `spec.<key>`. The raw value can be numeric or bilingual text. Resolve shop and voucher metadata from their catalog definitions.
- Pricing consumers can import `optimizeDeal(basket, context)` and `findAddOns(basket, context)` from `src/lib/pricing/index.ts`. Pass a stable store-opening timestamp as `openedAt` and a reference timestamp as `now`, both in milliseconds. The default coin balance is shared. The receipt contains `items`, `shops`, `subtotal`, `shipping`, `baseline`, `appliedVouchers`, `unusedVouchers`, `coinsUsed`, `total` and `savings`. A `null` receipt means there is no confirmed total. Show the appropriate empty or invalid-basket state in that case.
- The shared baseline was pending at implementation start. These export types live in the domain modules for consumer review. Owner 4 still owns `src/lib/contracts.ts`; reconcile types with Owners 2 and 3 before merging the storefront wiring.

### Task 2: Resolve and format the first real listing

- [ ] Create `src/lib/catalog/facts.spec.ts`. Run `bun run test:unit --run --project server src/lib/catalog/facts.spec.ts` and capture the missing implementation failure. Assert the shared anchor fixture resolves independently by ID and field, formats in Thai and English exactly as agreed and preserves fractional capacity. Unknown IDs, unknown fields, inherited object keys and absent original prices return the agreed missing result.
- [ ] Implement `src/lib/catalog/products.ts`, `facts.ts` and `index.ts` in that directory. Give each fact stable identity, typed raw value and unit. Keep bilingual wording and formatting in the domain. Expose a read-only product lookup for scoped citations and ranking.
- [ ] Repeat the command and confirm all assertions pass. Push a small reviewed increment and give Owner 3 the import paths and tested bilingual example for the first two-pane check.

### Task 3: Complete the simulated catalog

- [ ] Create `src/lib/catalog/catalog.spec.ts` and run `bun run test:unit --run --project server src/lib/catalog/catalog.spec.ts`. Expect the first-listing implementation to fail cardinality and story assertions.
- [ ] Extend products and add `src/lib/catalog/shops.ts`, `specs.ts` and `vouchers.ts` with the documented 33 products, five categories, five shops and ten voucher definitions. Preserve the exact tabulated data. Curate remaining simulated review counts, bilingual summaries, two highlights and four scores once in the catalog.
- [ ] Assert unique IDs, shop references, complete category-specific specs with ordered units/directions, word-valued specs excluded from numeric ranking, complete locales, valid counts, score/rating ranges, whole positive prices, optional original price above current and nonnegative integer shipping. Verify the three under-budget mice by identity, Vortex battery and review, rice-cooker senior reviews and SportFit's waterproof tag with no citable waterproof spec. Check each voucher's minimum, cap, scope and expiry against the reference definitions.
- [ ] Run `bun run test:unit --run --project server src/lib/catalog`, expect green, commit and push. Give Owner 2 the eligible mouse IDs, raw ranking inputs and listing references for the Aero X and question tests. Owner 2 verifies the final order and price-free outbound projection.

### Task 4: Price every legal combination

- [ ] Write `src/lib/pricing/optimizer.spec.ts` and run `bun run test:unit --run --project server src/lib/pricing/optimizer.spec.ts` to see the missing optimizer fail. Pin the full anchor receipt. Add a synthetic basket of 1,000 with free shipping, shop discount 100 and a platform discount 200 requiring 1,000. Skipping the shop discount gives 720 after coins, beating 810. Exercise the same production search with these synthetic definitions.
- [ ] Implement `src/lib/pricing/optimizer.ts` and export through `src/lib/pricing/index.ts`. For each shop take its maximum shipping fee and enumerate zero or one shop voucher. Use the post-shop item amount to qualify platform and shipping vouchers. Try zero or one of each. Floor and cap each discount, then spend at most the balance and the floor of ten percent of remaining payable. Choose minimum total, fewer vouchers, then stable voucher IDs. Bound pathological candidate sets per the pricing guideline and test the real catalog stays below the bound.
- [ ] Test multi-shop shipping, repeated quantities, reordered lines, exact minimums, fractional discount floors, caps, zero balance, ties and zero-value shipping. Test validity at expiry and the 24-hour soon boundary using an injected reference time and fixed opening. Check hostile basket IDs, invalid quantities and overflow at the agreed input boundary. Assert no negative or fractional receipt amounts and that line items reconcile to total and savings.
- [ ] Emit each unused voucher once with expired, unmet minimum and exact gap, ineligible shop, or beaten reason. Pin gap ordering then expired then remaining, with a stable tie order. Repeat the focused command, commit and push on green. Give Owner 3 the receipt and reason-code fixture for card, chat and section tests.

### Task 5: Find add-ons and verify consumer parity

- [ ] Write `src/lib/pricing/addons.spec.ts` and run `bun run test:unit --run --project server src/lib/pricing/addons.spec.ts` to establish the failing case. Test a new eligible product unlocking a previously unavailable voucher, an existing basket item, a price above 1,000, and a candidate that fails to reduce its effective extra cost.
- [ ] Implement `src/lib/pricing/addons.ts` and export `findAddOns(basket, context)`. Call the same optimizer for the original and augmented basket with identical context. Keep only newly applied vouchers previously blocked by shop or spend, and extra cost in [0, candidate price). Return up to three by extra cost with deterministic ID tie breaks. Return product and voucher IDs for the chat receipt.
- [ ] Run `bun run test:unit --run --project server src/lib/catalog src/lib/pricing` and `bun run check`. Expect both suites green and no type errors. Commit named files after reviewing the staged diff, push and give Owners 2–4 the base SHA, diff, executed commands, actual results and outstanding issues. Owner 3 checks matching receipts through real card, chat and page actions. Owner 4 reruns the combined journey.
- [ ] Ask Owner 2 for domain review and Owner 3 for shared interface review. Sync current main before merge, reconcile shared changes with the affected owner, rerun both affected suites and record results on the merged candidate. Coordinate guideline amendments with Owner 4 in the behavior PR.

**Copyable start prompt**

> You are Owner 1 using Sol on feat/catalog-pricing. Read AGENTS.md, the approved two-shopper design and this plan. Send Owner 4 the anchor fact and receipt inputs first. Sync to the reviewed contract baseline, record its SHA, and own only src/lib/catalog and src/lib/pricing. Prove each domain behavior with a failing server Vitest before implementing it. Push small reviewed increments and hand the tested imports and evidence to the named consumers.
