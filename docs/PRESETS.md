# Preset and module handoff

Status: the user-supplied **177-module design reference across twelve groups** is the
inventory authority. It replaces the earlier incorrect twelve-by-twelve inventory.
The separate twenty presentation presets are **inspection examples only**: they cannot
apply a view to the shop. No database, API, model, shared ranker or Svelte implementation
is changed by these registries.
The inspection route uses the storefront's simulated catalog and shared pricing
logic. An original photograph is shown only when the module has a matching asset.

Image blocks identify any missing original photography. Category illustrations
remain identified as illustrations.

## Availability means design support, not feature completion

- `ready`: this module's **design** can use existing local presentation, canonical
  fixture facts or pricing behavior. It does not certify a fully implemented feature,
  a live marketplace service, production data, or a completed UI integration.
- `service`: the named module requires missing data, state or service behavior. Render
  its anatomy with neutral blocks and its module-specific unavailable/dependency copy.
  Do not fabricate facts, enable pretend actions, or replace it with an unrelated module.
- Mixed-capability modules stay `service` when the full title requires unsupported
  behavior. For example, local Add to cart exists, but **Add-to-cart/buy action** also
  needs checkout; a warranty-duration spec does not supply a return policy.
- `Recipe.dependency` states the exact required source and limitation. `dependencies`
  is only a block-level hint and must not determine a module's availability.

No unsupported research statistic or claim about Shopee's current functionality was
imported from the reference. Its English titles name designs, not verified facts.

## Exact export contracts

`src/lib/presets/parts.ts` exports `copy`, `parts`, `blockNames`, `dependencies` and
these types. Existing `Part`/`Recipe` fields, block keys and six arrangements remain;
`Recipe` adds `availability` and `dependency`.

```ts
export type Copy = { en: string; th: string };
export type PartId =
  | 'global-shell' | 'intent-onboarding' | 'adaptive-homepage'
  | 'search-discovery' | 'results-listing' | 'product-detail'
  | 'trust-proof' | 'live-video-social' | 'smart-basket'
  | 'checkout-payment' | 'post-purchase' | 'account-safety';
export type Block = 'search' | 'categories' | 'scope' | 'preferences' | 'products'
  | 'photos' | 'specs' | 'price' | 'source' | 'question' | 'saved' | 'budget'
  | 'voucher' | 'shipping' | 'payment' | 'orders' | 'review' | 'apply' | 'undo';
export type Arrangement = 'stack' | 'split' | 'tiles' | 'rail' | 'receipt' | 'focus';
export type Availability = 'ready' | 'service';
export type Recipe = {
  id: string; title: Copy; blocks: Block[]; arrangement: Arrangement;
  need: Copy; trigger: Copy; availability: Availability; dependency: Copy;
};
export type Part = {
  id: PartId; title: Copy; purpose: Copy; dependency: Copy; recipes: Recipe[];
};
// Values:
copy(en: string, th: string): Copy;
parts: Part[];
blockNames: Record<Block, Copy>;
dependencies: Set<Block>;
```

Module IDs are `<group-id>-<two-digit ordinal>` in the exact reference order. Repeated
English titles across groups are intentional; module IDs remain globally unique.
Anatomy can recur: uniqueness is the authored module identity and purpose, not artificial
permutations of blocks. Every module supplies bilingual title, need, trigger and dependency.
Default triggers describe explicitly opening that named module for the current task;
these are design triggers, not behavioral tracking or inferred personal traits.

`photos`, `specs`, `price` and `source` keep stable keys with the labels **Catalog
images**, **Catalog specs**, **Catalog price** and **Catalog source**. These do not
imply original-listing timestamps or live data. Payment and order block labels explicitly
state that the services are unavailable. Available shipping designs show fee facts,
not arrival dates. Available review designs show supplied ratings/counts/quotes, not
rating distributions, verified-purchase status or buyer media. The coin design uses
the shared simulated balance, not a live wallet. Sharing designs use presentation
links, not a collaborative cart or a product shortlist.

`src/lib/presets/plans.ts` is unchanged and exports:

```ts
export type PresetField = 'theme' | 'layout' | 'density' | 'details' | 'sections';
export type PresetPatch = Partial<Pick<ShopperPlan, PresetField>>;
export type ShopPreset = { id: string; title: Copy; description: Copy; patch: PresetPatch };
shopPresets: readonly ShopPreset[];
presetPatch(id: unknown, plan: ShopperPlan): PresetPatch;
```

`presetPatch` accepts an exact authored string ID, selects only those five fields and
uses `validateProposal`. Unknown IDs return `{}`. Returned patches include price and
products, keep large-print spacing spacious, and leave every non-presentation plan
field unchanged. The helper does not apply the patch; use it only to construct an
isolated comparison example, never to offer a main-flow preset chooser or apply an
example to the shopper's store. It preserves ranking preferences, not a guarantee of
unchanged visible ordering when the main renderer changes.

## Twelve groups and their exact counts

| Group ID            | Reference group title                       | Modules | Ready designs | Service designs |
| ------------------- | ------------------------------------------- | ------: | ------------: | --------------: |
| `global-shell`      | Global shell                                |      12 |             8 |               4 |
| `intent-onboarding` | Intent and onboarding                       |      12 |             8 |               4 |
| `adaptive-homepage` | Adaptive homepage                           |      18 |             4 |              14 |
| `search-discovery`  | Search and discovery                        |      15 |            10 |               5 |
| `results-listing`   | Results and product listing                 |      15 |            13 |               2 |
| `product-detail`    | Product detail page                         |      18 |             9 |               9 |
| `trust-proof`       | Trust and decision proof                    |      12 |             3 |               9 |
| `live-video-social` | Live, video, and social commerce            |      12 |             0 |              12 |
| `smart-basket`      | Smart basket and promotion                  |      18 |             8 |              10 |
| `checkout-payment`  | Checkout and payment                        |      15 |             2 |              13 |
| `post-purchase`     | Post-purchase and retention                 |      15 |             2 |              13 |
| `account-safety`    | Account, loyalty, safety, and accessibility |      15 |             6 |               9 |

Total: **177 modules**: **73 ready designs** and **104 service designs**.

## Exact module inventory

### Global shell

| Module ID         | Exact English title             | Design status | Required source / capability                                      |
| ----------------- | ------------------------------- | ------------- | ----------------------------------------------------------------- |
| `global-shell-01` | Home/navigation                 | `ready`       | existing root/category navigation                                 |
| `global-shell-02` | Universal search                | `ready`       | existing query controls and canonical fixture search              |
| `global-shell-03` | Category navigator              | `ready`       | canonical category names and explicit category selection          |
| `global-shell-04` | Shopping-goal switcher          | `ready`       | the existing optional interview and authored presentation choices |
| `global-shell-05` | Active preference chips         | `ready`       | the current plan, explicit preference locks and Undo              |
| `global-shell-06` | Active moment chips             | `service`     | explicit moment state and supported moment-to-product mappings    |
| `global-shell-07` | Wishlist                        | `service`     | a wishlist store and save/remove controls                         |
| `global-shell-08` | Compare tray                    | `service`     | persistent product-comparison selection and tray controls         |
| `global-shell-09` | Cart                            | `ready`       | the shared local cart and canonical product/shop IDs              |
| `global-shell-10` | Order tracker                   | `service`     | an authenticated order service and real order status              |
| `global-shell-11` | Language and accessibility      | `ready`       | existing language/theme controls and reduced-motion styles        |
| `global-shell-12` | “What changed,” Undo, and Reset | `ready`       | existing plan differences and atomic Undo/Reset                   |

### Intent and onboarding

| Module ID              | Exact English title                     | Design status | Required source / capability                                      |
| ---------------------- | --------------------------------------- | ------------- | ----------------------------------------------------------------- |
| `intent-onboarding-01` | “What are you shopping for?” entry      | `ready`       | the existing optional interview and authored presentation choices |
| `intent-onboarding-02` | Browse without personalizing            | `ready`       | existing root/category navigation                                 |
| `intent-onboarding-03` | Quick preference picker                 | `ready`       | the current plan, explicit preference locks and Undo              |
| `intent-onboarding-04` | Budget selector                         | `ready`       | the shopper's explicit catalog price ceiling                      |
| `intent-onboarding-05` | Information-style selector              | `ready`       | existing theme, layout and detail-field controls                  |
| `intent-onboarding-06` | Buying-for-myself/another-person        | `ready`       | the existing optional interview and authored presentation choices |
| `intent-onboarding-07` | Occasion selector                       | `service`     | an explicit occasion planner and catalog suitability evidence     |
| `intent-onboarding-08` | Delivery deadline                       | `service`     | logistics estimates, destination and promised delivery dates      |
| `intent-onboarding-09` | Comfort/large-print mode                | `ready`       | existing language/theme controls and reduced-motion styles        |
| `intent-onboarding-10` | Existing-product replacement            | `service`     | owned-product identity and supported replacement mappings         |
| `intent-onboarding-11` | Repeat-purchase shortcut                | `service`     | authenticated purchase history and reorder eligibility            |
| `intent-onboarding-12` | Personalization explanation and opt-out | `ready`       | the existing optional interview and authored presentation choices |

### Adaptive homepage

| Module ID              | Exact English title                      | Design status | Required source / capability                                        |
| ---------------------- | ---------------------------------------- | ------------- | ------------------------------------------------------------------- |
| `adaptive-homepage-01` | Continue previous task                   | `ready`       | existing saved plan and in-session store visit state                |
| `adaptive-homepage-02` | Recent searches                          | `service`     | a consented search-history store and history controls               |
| `adaptive-homepage-03` | Replenish regular items                  | `service`     | authenticated purchase history and reorder eligibility              |
| `adaptive-homepage-04` | Current category shelf                   | `ready`       | canonical category names and explicit category selection            |
| `adaptive-homepage-05` | Moment shelf                             | `service`     | explicit moment state and supported moment-to-product mappings      |
| `adaptive-homepage-06` | Weather-relevant shelf                   | `service`     | location consent, weather data and supported product relevance      |
| `adaptive-homepage-07` | Occasion planner                         | `service`     | an explicit occasion planner and catalog suitability evidence       |
| `adaptive-homepage-08` | Complete-a-project shelf                 | `service`     | task requirements and verified complementary-product relationships  |
| `adaptive-homepage-09` | Complete-the-look                        | `service`     | supported style relationships and complete outfit/set evidence      |
| `adaptive-homepage-10` | Family essentials                        | `service`     | explicit household requirements and supported suitability data      |
| `adaptive-homepage-11` | Budget picks                             | `ready`       | the shopper's explicit catalog price ceiling                        |
| `adaptive-homepage-12` | Premium step-up                          | `service`     | comparable product differences and evidenced incremental benefit    |
| `adaptive-homepage-13` | New-product discovery                    | `service`     | catalog introduction dates and a supported newness criterion        |
| `adaptive-homepage-14` | Live shopping                            | `service`     | a live-stream service and verified stream/product associations      |
| `adaptive-homepage-15` | Short-video reviews                      | `service`     | licensed video metadata, playback and verified product associations |
| `adaptive-homepage-16` | Saved-product price update               | `service`     | timestamped price observations and saved-item watch state           |
| `adaptive-homepage-17` | Membership/reward summary                | `service`     | authenticated membership and reward entitlements                    |
| `adaptive-homepage-18` | “You’ve seen everything relevant” ending | `ready`       | the finite current fixture result list and result count             |

### Search and discovery

| Module ID             | Exact English title          | Design status | Required source / capability                                          |
| --------------------- | ---------------------------- | ------------- | --------------------------------------------------------------------- |
| `search-discovery-01` | Text search                  | `ready`       | existing query controls and canonical fixture search                  |
| `search-discovery-02` | Conversational search        | `ready`       | the existing validated offline assistant and cite-or-decline boundary |
| `search-discovery-03` | Category suggestions         | `service`     | an explicit category-suggestion policy and matching evidence          |
| `search-discovery-04` | Query correction             | `service`     | a query-correction dictionary and shopper-confirmed replacements      |
| `search-discovery-05` | Search history               | `service`     | a consented search-history store and history controls                 |
| `search-discovery-06` | Search-by-use-case           | `ready`       | existing query controls and canonical fixture search                  |
| `search-discovery-07` | Search-by-recipient          | `service`     | explicit recipient requirements and supported product matching        |
| `search-discovery-08` | Search-by-budget             | `ready`       | the shopper's explicit catalog price ceiling                          |
| `search-discovery-09` | Search-by-delivery date      | `service`     | logistics estimates, destination and promised delivery dates          |
| `search-discovery-10` | Search-by-specification      | `ready`       | existing deterministic ranking terms and catalog score inputs         |
| `search-discovery-11` | Search inside reviews        | `ready`       | existing search over a listing's fixture review text                  |
| `search-discovery-12` | Visual discovery             | `ready`       | catalog-associated image assets; no visual-search or video inference  |
| `search-discovery-13` | Compare-from-search          | `ready`       | existing comparison tables over the current catalog results           |
| `search-discovery-14` | Ask-the-assistant            | `ready`       | the existing validated offline assistant and cite-or-decline boundary |
| `search-discovery-15` | Explain why results appeared | `ready`       | existing deterministic ranking terms and catalog score inputs         |

### Results and product listing

| Module ID            | Exact English title          | Design status | Required source / capability                                               |
| -------------------- | ---------------------------- | ------------- | -------------------------------------------------------------------------- |
| `results-listing-01` | Visual grid                  | `ready`       | existing theme, layout and detail-field controls                           |
| `results-listing-02` | Compact list                 | `ready`       | existing theme, layout and detail-field controls                           |
| `results-listing-03` | Specification table          | `ready`       | existing comparison tables over the current catalog results                |
| `results-listing-04` | Simple three-choice mode     | `ready`       | the existing simplified-plan option and bounded product list               |
| `results-listing-05` | Price-first cards            | `ready`       | canonical price and optional original-price facts                          |
| `results-listing-06` | Quality-first cards          | `ready`       | catalog ratings, review counts and supplied review quotes; no distribution |
| `results-listing-07` | Delivery-first cards         | `ready`       | canonical shipping-fee facts only; no arrival-date estimate                |
| `results-listing-08` | Accessibility-first cards    | `ready`       | existing language/theme controls and reduced-motion styles                 |
| `results-listing-09` | Sort controls                | `ready`       | existing deterministic ranking terms and catalog score inputs              |
| `results-listing-10` | Removable filters            | `ready`       | existing search/filter controls and explicit clear actions                 |
| `results-listing-11` | Product comparison selection | `service`     | persistent product-comparison selection and tray controls                  |
| `results-listing-12` | “Why this order?”            | `ready`       | existing deterministic ranking terms and catalog score inputs              |
| `results-listing-13` | Sponsored-result disclosure  | `service`     | verified paid-placement metadata and disclosure policy                     |
| `results-listing-14` | No-result recovery           | `ready`       | existing search/filter controls and explicit clear actions                 |
| `results-listing-15` | Facts-rechecked receipt      | `ready`       | existing fact resolution and mounted-fact verification receipts            |

### Product detail page

| Module ID           | Exact English title              | Design status | Required source / capability                                                                         |
| ------------------- | -------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| `product-detail-01` | Product media                    | `ready`       | catalog-associated image assets; no visual-search or video inference                                 |
| `product-detail-02` | Product name                     | `ready`       | localized canonical product names                                                                    |
| `product-detail-03` | Current and original price       | `ready`       | canonical price and optional original-price facts                                                    |
| `product-detail-04` | Variant selector                 | `service`     | variant identifiers, selectable options and current stock                                            |
| `product-detail-05` | Delivery estimate                | `service`     | logistics estimates, destination and promised delivery dates                                         |
| `product-detail-06` | Seller information               | `ready`       | canonical shop identity fields; no inferred trust score                                              |
| `product-detail-07` | Specification table              | `ready`       | canonical specifications with category-specific keys and units                                       |
| `product-detail-08` | Short summary                    | `ready`       | localized canonical listing summaries                                                                |
| `product-detail-09` | Review overview                  | `ready`       | catalog ratings, review counts and supplied review quotes; no distribution                           |
| `product-detail-10` | Review gallery                   | `service`     | verified buyer-review media and attribution                                                          |
| `product-detail-11` | Certification and authenticity   | `service`     | issuer-backed certification records and authenticity evidence                                        |
| `product-detail-12` | Warranty and return policy       | `service`     | actual seller warranty and return-policy terms; duration specs alone are insufficient                |
| `product-detail-13` | Compatibility checker            | `service`     | verified compatibility relationships between selected products                                       |
| `product-detail-14` | “Good for your need” explanation | `ready`       | existing deterministic ranking terms and catalog score inputs                                        |
| `product-detail-15` | Honest step-up comparison        | `service`     | comparable product differences and evidenced incremental benefit                                     |
| `product-detail-16` | Complete-the-set                 | `service`     | task requirements and verified complementary-product relationships                                   |
| `product-detail-17` | Best-price calculation           | `ready`       | the existing optimizer, canonical basket facts and shared simulated coin balance                     |
| `product-detail-18` | Add-to-cart/buy action           | `service`     | transactional checkout, current stock and payment confirmation; local add-to-cart alone is available |

### Trust and decision proof

| Module ID        | Exact English title               | Design status | Required source / capability                                             |
| ---------------- | --------------------------------- | ------------- | ------------------------------------------------------------------------ |
| `trust-proof-01` | Verified catalog-fact receipt     | `ready`       | existing fact resolution and mounted-fact verification receipts          |
| `trust-proof-02` | Seller trust summary              | `service`     | verified seller performance, dispute and reliability records             |
| `trust-proof-03` | Authenticity source               | `service`     | traceable product provenance and verified authenticity records           |
| `trust-proof-04` | Certification source              | `service`     | issuer-backed certification records and authenticity evidence            |
| `trust-proof-05` | Review distribution               | `service`     | per-rating review totals from an authoritative review source             |
| `trust-proof-06` | Verified-purchase filter          | `service`     | verified-purchase flags attached to individual reviews                   |
| `trust-proof-07` | Common review themes              | `service`     | source-linked review theme annotations; isolated quotes are insufficient |
| `trust-proof-08` | Return-rate warning, if available | `service`     | auditable return counts, sales denominators and observation windows      |
| `trust-proof-09` | Price-history explanation         | `service`     | timestamped price observations and saved-item watch state                |
| `trust-proof-10` | Recommendation reason             | `ready`       | existing deterministic ranking terms and catalog score inputs            |
| `trust-proof-11` | Sponsored-content label           | `service`     | verified paid-placement metadata and disclosure policy                   |
| `trust-proof-12` | “Cannot confirm” state            | `ready`       | the existing validated offline assistant and cite-or-decline boundary    |

### Live, video, and social commerce

| Module ID              | Exact English title           | Design status | Required source / capability                                                                       |
| ---------------------- | ----------------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| `live-video-social-01` | Relevant live stream          | `service`     | a live-stream service and verified stream/product associations                                     |
| `live-video-social-02` | Live product tray             | `service`     | a live-stream service and verified stream/product associations                                     |
| `live-video-social-03` | Question-to-seller            | `service`     | an authenticated seller messaging service                                                          |
| `live-video-social-04` | Product demonstration chapter | `service`     | licensed demonstration videos with authored chapter timestamps                                     |
| `live-video-social-05` | Short-video feed              | `service`     | licensed video metadata, playback and verified product associations                                |
| `live-video-social-06` | Video-to-product mapping      | `service`     | verified video-to-product IDs and content availability                                             |
| `live-video-social-07` | Creator disclosure            | `service`     | verified creator identity and commercial-relationship disclosures                                  |
| `live-video-social-08` | Affiliate disclosure          | `service`     | verified affiliate attribution and compensation disclosure                                         |
| `live-video-social-09` | Save video product            | `service`     | a saved-video store and verified video/product associations                                        |
| `live-video-social-10` | Compare products from a video | `service`     | verified video/product associations and a product-selection tray                                   |
| `live-video-social-11` | Share a shortlist             | `service`     | a serializable product shortlist and share/restore contract; current links share presentation only |
| `live-video-social-12` | Resume shopping after content | `service`     | media playback position and an associated shopping-task state                                      |

### Smart basket and promotion

| Module ID         | Exact English title           | Design status | Required source / capability                                                     |
| ----------------- | ----------------------------- | ------------- | -------------------------------------------------------------------------------- |
| `smart-basket-01` | Basket grouped by seller      | `ready`       | the shared local cart and canonical product/shop IDs                             |
| `smart-basket-02` | Final-price preview           | `ready`       | the existing optimizer, canonical basket facts and shared simulated coin balance |
| `smart-basket-03` | Shipping-fee breakdown        | `ready`       | the existing optimizer, canonical basket facts and shared simulated coin balance |
| `smart-basket-04` | Voucher optimizer             | `ready`       | the existing optimizer, canonical basket facts and shared simulated coin balance |
| `smart-basket-05` | Coin optimizer                | `ready`       | the existing optimizer, canonical basket facts and shared simulated coin balance |
| `smart-basket-06` | Applied-promotion receipt     | `ready`       | the existing optimizer, canonical basket facts and shared simulated coin balance |
| `smart-basket-07` | Unused-voucher explanation    | `ready`       | the existing optimizer, canonical basket facts and shared simulated coin balance |
| `smart-basket-08` | Free-shipping progress        | `service`     | an optimizer-provided shipping-eligibility progress contract                     |
| `smart-basket-09` | Honest gap filler             | `ready`       | existing optimizer add-on explanations with extra cost and no automatic addition |
| `smart-basket-10` | Compatible accessory          | `service`     | verified compatibility relationships between selected products                   |
| `smart-basket-11` | Complete-the-set              | `service`     | task requirements and verified complementary-product relationships               |
| `smart-basket-12` | Complete-the-look             | `service`     | supported style relationships and complete outfit/set evidence                   |
| `smart-basket-13` | Routine bundle                | `service`     | verified routine membership and product suitability relationships                |
| `smart-basket-14` | Family pack                   | `service`     | canonical pack variants, quantities and unit comparisons                         |
| `smart-basket-15` | Refill quantity               | `service`     | verified refill compatibility, quantities and current stock                      |
| `smart-basket-16` | Budget guard                  | `service`     | a separately declared basket budget and enforced total-cost checks               |
| `smart-basket-17` | Remove/hide recommendation    | `service`     | recommendation-dismissal state and a supported suppression policy                |
| `smart-basket-18` | Save basket as a reusable set | `service`     | a reusable saved-basket schema and restore controls                              |

### Checkout and payment

| Module ID             | Exact English title      | Design status | Required source / capability                                                                         |
| --------------------- | ------------------------ | ------------- | ---------------------------------------------------------------------------------------------------- |
| `checkout-payment-01` | Delivery address         | `service`     | an authenticated delivery-address store and validation                                               |
| `checkout-payment-02` | Send-to-someone-else     | `service`     | recipient/contact consent and validated delivery details                                             |
| `checkout-payment-03` | Delivery-date selection  | `service`     | logistics estimates, destination and promised delivery dates                                         |
| `checkout-payment-04` | Seller shipment grouping | `service`     | a fulfillment service with actual seller shipment groups                                             |
| `checkout-payment-05` | Shipping method          | `service`     | eligible carrier services and destination-specific quotes                                            |
| `checkout-payment-06` | Voucher and Coin summary | `ready`       | the existing optimizer, canonical basket facts and shared simulated coin balance                     |
| `checkout-payment-07` | Final payable total      | `ready`       | the existing optimizer, canonical basket facts and shared simulated coin balance                     |
| `checkout-payment-08` | Payment selection        | `service`     | an authenticated payment provider and transaction state                                              |
| `checkout-payment-09` | COD option               | `service`     | seller/carrier cash-on-delivery eligibility and terms                                                |
| `checkout-payment-10` | Financing disclosure     | `service`     | provider-approved financing terms and complete fees                                                  |
| `checkout-payment-11` | Total financing cost     | `service`     | provider-approved financing terms and complete fees                                                  |
| `checkout-payment-12` | Invoice request          | `service`     | seller invoicing support and validated billing details                                               |
| `checkout-payment-13` | Gift wrap/message        | `service`     | seller gift-service availability, costs and validated instructions                                   |
| `checkout-payment-14` | Final order review       | `service`     | transactional checkout, current stock and payment confirmation; local add-to-cart alone is available |
| `checkout-payment-15` | Order confirmation       | `service`     | an authenticated order service and real order status                                                 |

### Post-purchase and retention

| Module ID          | Exact English title              | Design status | Required source / capability                                                                |
| ------------------ | -------------------------------- | ------------- | ------------------------------------------------------------------------------------------- |
| `post-purchase-01` | Order tracking                   | `service`     | an authenticated order service and real order status                                        |
| `post-purchase-02` | Delivery changes                 | `service`     | a fulfillment service with actual seller shipment groups                                    |
| `post-purchase-03` | Problem reporting                | `service`     | authenticated support cases and a dispute service                                           |
| `post-purchase-04` | Return/refund                    | `service`     | actual seller warranty and return-policy terms; duration specs alone are insufficient       |
| `post-purchase-05` | Confirm receipt                  | `service`     | an authenticated order service and real order status                                        |
| `post-purchase-06` | Product setup guide              | `service`     | product-specific verified setup instructions                                                |
| `post-purchase-07` | Usage guide                      | `service`     | product-specific verified usage and safety guidance                                         |
| `post-purchase-08` | Warranty storage                 | `service`     | ownership evidence and authenticated warranty-document storage                              |
| `post-purchase-09` | Ask about the product            | `ready`       | the existing validated offline assistant and cite-or-decline boundary                       |
| `post-purchase-10` | Review prompt                    | `service`     | verified purchase eligibility and a review-submission service                               |
| `post-purchase-11` | Replenishment reminder           | `service`     | explicit reminder consent, schedule and replenishment evidence                              |
| `post-purchase-12` | Compatible refill                | `service`     | verified refill compatibility, quantities and current stock                                 |
| `post-purchase-13` | Save as regular purchase         | `service`     | a consented recurring-purchase preference store                                             |
| `post-purchase-14` | Share with family                | `ready`       | existing presentation-only share links; no shared basket or purchase history                |
| `post-purchase-15` | Turn recommendation learning off | `service`     | a defined recommendation-learning system and consent controls; no online learning is active |

### Account, loyalty, safety, and accessibility

| Module ID           | Exact English title          | Design status | Required source / capability                                                          |
| ------------------- | ---------------------------- | ------------- | ------------------------------------------------------------------------------------- |
| `account-safety-01` | Preference center            | `ready`       | the current plan, explicit preference locks and Undo                                  |
| `account-safety-02` | Recommendation controls      | `ready`       | existing deterministic ranking terms and catalog score inputs                         |
| `account-safety-03` | Personalization explanation  | `ready`       | existing plan differences and atomic Undo/Reset                                       |
| `account-safety-04` | Clear session/profile        | `service`     | an atomic session/cart/conversation/profile deletion contract; plan Reset is narrower |
| `account-safety-05` | Membership status            | `service`     | authenticated membership and reward entitlements                                      |
| `account-safety-06` | Coin balance                 | `ready`       | the existing shared simulated coin constant and optimizer; not a live account balance |
| `account-safety-07` | Voucher wallet               | `service`     | authenticated owned-voucher entitlements; catalog vouchers are not a wallet           |
| `account-safety-08` | Saved sets                   | `service`     | a reusable saved-set store and explicit restore controls                              |
| `account-safety-09` | Following/creator management | `service`     | authenticated following relationships and creator management                          |
| `account-safety-10` | Notification controls        | `service`     | consented notification preferences and a delivery service                             |
| `account-safety-11` | Security center              | `service`     | authenticated account security/session-management services                            |
| `account-safety-12` | Payment management           | `service`     | an authenticated payment provider and transaction state                               |
| `account-safety-13` | Language                     | `ready`       | existing language/theme controls and reduced-motion styles                            |
| `account-safety-14` | Large print/reduced motion   | `ready`       | existing language/theme controls and reduced-motion styles                            |
| `account-safety-15` | Support and dispute history  | `service`     | authenticated support cases and a dispute service                                     |

## Twenty inspection examples

All twenty are authored comparison examples using the existing section library. They differ
in layout, information selection and/or sections even when theme and density are
ignored. Inspecting an example must not change the active shop, its saved state, locks
or history, and must not expose an Apply-to-shop action. Their patches preserve ranking
preferences and filters. Switching from the default renderer to the adapted renderer
can still change the visible order through existing main behavior; this registry does
not change the shared ranker.

| ID                     | Theme / layout / density       | Workflow                                                      |
| ---------------------- | ------------------------------ | ------------------------------------------------------------- |
| `everyday-browse`      | standard / grid / comfortable  | Pictures, price, rating, shop and shipping                    |
| `quick-scan`           | minimal / grid / compact       | Pictures, price and shop only                                 |
| `picture-stories`      | vibrant / grid / spacious      | Pictures and short summaries                                  |
| `review-led-browse`    | standard / grid / comfortable  | Review section before cards with reviews                      |
| `spec-workbench`       | minimal / table / compact      | Direct specification comparison                               |
| `guided-comparison`    | standard / table / spacious    | Existing priority explanation before the table                |
| `compare-then-browse`  | minimal / grid / comfortable   | Leading-product comparison before specification cards         |
| `summary-reading`      | minimal / list / spacious      | Pictures and listing summaries                                |
| `spec-reading`         | standard / list / comfortable  | Specifications and summaries without images                   |
| `delivery-check`       | standard / list / compact      | Catalog shipping, shop and price                              |
| `deal-receipt`         | minimal / list / compact       | Optimizer receipt followed by voucher details                 |
| `deal-and-compare`     | standard / table / comfortable | Optimizer receipt followed by specification table             |
| `guided-shortlist`     | vibrant / list / comfortable   | Existing priorities, leading choices, then remaining products |
| `gift-discussion`      | vibrant / grid / comfortable   | Leading choices, reviews and presentation sharing             |
| `review-and-compare`   | minimal / table / comfortable  | Review quotes before the table                                |
| `large-picture-browse` | large-print / grid / spacious  | Large-text picture cards with summaries and shipping          |
| `large-reading-guide`  | large-print / list / spacious  | Existing priorities followed by readable summaries            |
| `large-comparison`     | large-print / list / spacious  | Leading-product comparison followed by readable details       |
| `large-deal-review`    | large-print / list / spacious  | Readable optimizer receipt and voucher details                |
| `shared-decision`      | standard / list / comfortable  | Comparison, reviews and presentation sharing                  |

Optional sections disappear when their existing data requirements are not met.
`what-matters` explains current priorities; `top-picks` uses current ranking;
`best-deal` uses the existing optimizer and shared clock/coin balance. Sharing concerns
presentation, not a newly implemented shared cart or collaborative shortlist.

## Integration and validation

1. Render one inventory from `parts`; read each recipe's availability and dependency.
   Service modules remain inspectable designs with clear missing-data copy.
2. Read `shopPresets` only for the separate inspection demo. Keep example state isolated
   from the active store. Each example selects display fields from the fixed library.
   Its product links retain the active language and reading theme.
3. On the canonical storefront, the optional interview ends in Review. Apply
   commits a validated change in one Undo step; Cancel discards the draft.
   Existing direct controls and accessibility settings remain available. The optional sourced storefront preview defines its own explicitly labeled Finish action.
4. Keep the canonical storefront’s interview entry and shared Undo history. Use
   DynamicShopper's orange identity without Shopee marks or affiliation claims.
   This inventory creates neither a second interview nor a new main-flow chooser.
5. Keep all facts and deal amounts on canonical catalog/optimizer paths. Do not send
   prices to the model. Wait for updated data rather than filling unavailable modules.

```sh
bun run test:unit --run --project server src/lib/presets
```

The part tests contain an independent exact group/title manifest from the uploaded
reference. They verify the 177 count, per-group counts, module order/IDs, bilingual
metadata, supported block vocabulary and conservative service classification. The
unchanged plan tests verify twenty unique workflows, allowed keys, mandatory price and
products, invalid IDs, returned-array isolation and unchanged plans/catalog records.
Browser checks compare leading example links against the shared ranker and retain the selected listing language and reading size. UI review and
browser behavior remain separate from these pure server checks.
