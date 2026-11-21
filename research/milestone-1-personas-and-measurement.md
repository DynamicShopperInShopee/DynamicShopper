# Milestone 1: shopper hypotheses and measurement brief

Status: proposed research and measurement decisions; not a change to product scope. 21 November 2026.

## Scope and evidence

DynamicShopper currently specifies simulated products and deals, no real marketplace checkout, accounts, database, seller analytics or long-term behavior tracking. The existing D1/SQLite infrastructure does not itself establish that shopper analytics or real orders exist. The immediate goal is to test whether shoppers can find, compare and understand products with a fact-locked adaptive interface. Real sales measurement requires a later, explicitly approved product-scope change and a real commerce integration.

The following personas are synthesized role-play hypotheses, not interviews, real users, or proven market segments. One person can move between them. Validate them with shoppers before using them to decide roadmap priorities. Do not infer a person's abilities or preferences from age alone.

Research context: the US International Trade Administration reports mobile's large role in Thai online shopping ([Thailand eCommerce](https://www.trade.gov/country-commercial-guides/thailand-ecommerce)). DHL's 2025 Thailand shopper report describes social discovery, reviews and discount interest among its surveyed online shoppers; its results should not be assumed representative of all Thai consumers ([report](https://www.dhl.com/content/dam/dhl/local/global/dhl-ecommerce/documents/pdf/g0-ecs-insights-country-report-thailand-2025.pdf)). Baymard finds that browsing and comparison explain some abandoned carts, alongside checkout problems; its checkout research is not specific to Thailand ([research](https://baymard.com/research-articles/ecommerce-checkout-usability-report-and-benchmark)). A Thai survey of 412 adult online shoppers associates perceived usefulness and recommendation quality with satisfaction; it does not prove a sales effect ([study](https://www.tci-thaijo.org/en/articles/social04-289825)).

## Persona role plays

### 1. Narin: the deliberate comparer

**Situation:** On a laptop at home, Narin is comparing earbuds for exercise and wants to inspect the relevant specs before choosing. The shopper may switch between Thai and English and may not trust a vague recommendation.

**Role play:** “ช่วยเทียบหูฟังสำหรับออกกำลังกาย เน้นแบตกับน้ำหนัก” → compares catalog specs → asks a question about a feature → checks why the products appear in that order.

**UX hypothesis:** A spec-first view, clear deterministic ranking explanation and citations reduce effort. If the listing lacks a requested fact, an honest inability to confirm is more useful than a guess. A question should not change the store.

**Test:** Can the participant identify the evidence supporting a choice, locate an unavailable fact, and explain the order without mistaking a review for a spec?

### 2. Mali: shopping for family

**Situation:** Mali is on a phone and wants a rice cooker for a parent. They have limited time, want a short list and may share the view with the person who will use the product. The parent may prefer larger text, but that is a preference to ask for, not an assumption about age.

**Role play:** “ซื้อหม้อหุงข้าวให้แม่ ขอแบบอ่านง่าย” → opens the large-print option → compares available catalog facts and deal receipt → shares a view without personal data.

**UX hypothesis:** A visible large-print control, limited selection, Thai text, clear deal breakdown and sharing help the decision. The full product list must remain available; the shopper can undo or change every presentation choice.

**Test:** Can both buyer and intended recipient read the page, find the products, understand the deal conditions, and change the presentation without losing their place?

### 3. Pim: mobile discovery and value

**Situation:** Pim sees a product discussed socially and visits on a phone between other tasks. They are curious rather than committed and want to verify the product and the actual available deal.

**Role play:** “มีแบบนี้ไหม ขอราคาคุ้มๆ” → searches the catalog → checks listed facts and reviews → opens the best-deal receipt → leaves or saves the view for later.

**UX hypothesis:** Fast search, readable product cards, factual reviews and an understandable voucher calculation support comparison. Do not interpret leaving or not buying as a UX failure by itself. No external social claims or invented review content should appear.

**Test:** Can the participant find the right listing, distinguish original and optimized prices, identify voucher conditions and return to browsing?

### 4. Alex: control and trust under interruption

**Situation:** Alex shops in English on a phone with a poor connection, wants a simpler display and does not want unexpected changes. They are willing to use chat but prefer direct controls when it fails.

**Role play:** “Show fewer details” → sees a change and its explanation → uses Undo → forces offline → asks a product question → uses the direct language and layout controls.

**UX hypothesis:** A stable product list, visible change explanation, Undo and a labeled offline fallback maintain confidence. Explicit choices should survive subsequent inference.

**Test:** Can the participant recover the previous view, continue offline and tell whether a product answer has supporting evidence?

## Cross-cutting conditions to test

- Phone at 390 × 844 and laptop at 1440 × 900; touch, keyboard and screen-reader navigation.
- Thai, English and mixed-language requests; varied reading and product knowledge.
- Low vision, enlarged text, reduced motion and contrast needs without assigning those needs to a demographic.
- First visit, returning to a saved plan, interrupted session, slow or unavailable AI, and no network.
- Known item versus exploratory browsing; product question versus deal request; no matching products.
- No AI key, invalid model proposal and poisoned-model test in development.

## Decisions and open concerns

| Item                                                          | Status                       | Reason or next decision                                                                              |
| ------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| Thailand-first research; Thai and English equal               | Proposed                     | Current product and research context support this; validate actual target market with stakeholders.  |
| Initial tasks: compare, family purchase and deal verification | Proposed                     | They cover the current product's main differentiators and varied information needs.                  |
| Treat scenarios as situational, not demographic segments      | Accepted for this brief      | Needs and accessibility preferences vary within every age group.                                     |
| Real checkout, D1 tracking and cross-session profiles         | Proposed for future decision | They conflict with current documented scope and need a separate product decision and design.         |
| External commerce and pricing ownership                       | Open                         | No real integration is specified; select authoritative systems before claiming live prices or sales. |
| Consent, retention and identity linkage                       | Open                         | Decide permitted collection and applicable privacy requirements before collecting real shopper data. |

## Prototype measurement baseline

No baseline values are available; collect them rather than inventing them. Recruit actual Thai and English shoppers, including people with accessibility needs, and observe the same tasks with AI available and with the offline fallback. Counterbalance ordering where practical. Ask participants to think aloud without coaching. Record whether a task succeeds, the error, and what evidence the participant used. Small qualitative studies reveal usability issues, not population conversion rates.

| Measure                | Definition                                                                                                                        | Source                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Task completion        | Participants completing a specified task without facilitator help ÷ participants attempting it                                    | Moderated study observation                        |
| Fact verification      | Participants correctly locating the catalog evidence or identifying that it is unavailable ÷ participants attempting the question | Observation and recorded task answer               |
| Recovery               | Participants who restore the prior view using Undo or Reset ÷ participants asked to recover                                       | Observation                                        |
| Deal comprehension     | Participants correctly identifying the displayed total and applicable conditions ÷ participants attempting the deal task          | Observation against the simulated optimizer output |
| Understanding accuracy | Golden messages with correct expected intent and plan changes ÷ eligible non-adversarial messages, separately for AI and fallback | Existing golden-set pipeline                       |
| Fact violations        | Number of violations in the defined safety checks; target zero                                                                    | Automated pipeline and hostile-output checks       |

Track failed journeys and usability observations as well as percentages. Do not treat simulated cart actions as real orders or use synthetic personas as evidence of conversion.

## Future commercial measurement: proposal only

If a real commerce product is approved, choose **completed orders per eligible randomized visitor** as the primary experiment metric. Proposed definition: unique visitors assigned to a test who start an eligible storefront session, with at least one verified completed order within seven days of first assignment, divided by all eligible assigned visitors. Count a visitor once, use consistent pseudonymous identity where permitted, count orders using the commerce system's verified status, and predefine exclusion and deduplication rules. Separately report revenue per visitor, cancellations, refunds, margin when available, and a later adjusted measure after the refund window; do not silently revise the primary result. Seven days is a starting assumption to validate against actual purchase cycles.

Proposed sources: D1 stores experiment assignment and consent-permitted event records; catalog and pricing systems own product facts; the order/payment system owns order and refund status. Reconcile order identifiers and timestamps before reporting results. D1 can hold aggregates initially; measure its load and cost before expanding retention or analytics workloads. If no trustworthy order feed or identity linkage exists, report only the measures supported by the data, not sales lift.

## Research plan and milestone acceptance

1. Recruit real participants across the scenarios and conditions; document consent and avoid claiming a representative sample.
2. Run the four role plays and the core journey, online and offline; record failures, quotes with permission and observed workarounds.
3. Review findings against product rules; log each concern and decision and revise hypotheses without tuning the golden set to the fallback.
4. Establish observed baseline results and data quality before a controlled experiment. A future experiment should predefine assignment unit, duration, sample size, primary metric and guardrails.

This brief completes the initial research synthesis and specifies a measurement plan. Participant validation, actual baselines, source-system ownership and authorization for real tracking remain open work; no customer interviews or live sales analysis have been performed.
