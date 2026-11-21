# Owner 2 contract proposal

Status: dropped as a runtime API proposal; the integrated storefront adopted
`src/lib/harness/index.ts` and its validated `handleTurn` pipeline instead. This
document and the shared draft fixture remain as design history, not a claim that
`applyTurn` is exported by the legacy personalization module.

Accepted: retain the five behavioral acceptance cases in `contract.spec.ts`, using
the shared product fixture and the actual harness APIs. The checks exercise
partial validation, no-op history, explicit language precedence, Undo and cited
answers without adding a second state reducer or weakening their guarantees.
The existing `personalization.spec.ts` still covers the legacy API used by
comparison and listing components.

This proposal follows the approved product language (`language`, `cardFields`,
`searchWords`) rather than the unreviewed implementation on another owner's
branch. It keeps model output separate from catalog facts: a validated turn can
select presentation values and carry references, but it cannot carry product
copy, prices, listing values or arbitrary diagnostic text.

## Public engine exports

```ts
rankProducts(products: readonly Product[], plan: Plan): RankedProduct[];
interpretOffline(message: string, state: StoreState): Turn;
applyTurn(state: StoreState, turn: Turn): StoreState;
```

All three functions are synchronous, browser-safe and pure. `interpretOffline`
performs no fetches. Inputs and returned collections are immutable.

## Proposed shared shapes

```ts
type Language = 'en' | 'th';
type Theme = 'standard' | 'minimal' | 'vibrant' | 'large-print';
type Layout = 'grid' | 'list' | 'table';
type Density = 'compact' | 'comfortable' | 'spacious';
type Direction = 'higher' | 'lower';

type CardField =
	'image' | 'price' | 'rating' | 'specs' | 'summary' | 'reviews' | 'shipping' | 'vouchers' | 'shop';

type SectionId =
	'top-picks' | 'compare' | 'what-matters' | 'reviews' | 'best-deal' | 'share' | 'products';

type PriorityKey = 'price' | 'performance' | 'durability' | 'design' | 'rating' | 'value';

type Plan = Readonly<{
	theme: Theme;
	layout: Layout;
	density: Density;
	language: Language;
	cardFields: readonly CardField[];
	highlightedSpecs: readonly SpecKey[];
	searchWords: readonly string[];
	category: Category | null;
	maxPrice: number | null;
	shopIds: readonly ShopId[];
	mallOnly: boolean;
	simplified: boolean;
	sections: readonly SectionId[];
	priorities: Readonly<Partial<Record<PriorityKey, number>>>;
	specPreferences: Readonly<Partial<Record<SpecKey, Direction>>>;
}>;

// Lists replace. Empty searchWords/shopIds and null filters explicitly clear.
// Zero disables a priority; null removes an individual spec preference.
type PlanPatch = Readonly<
	Partial<{
		theme: Theme;
		layout: Layout;
		density: Density;
		language: Language;
		cardFields: readonly CardField[];
		highlightedSpecs: readonly SpecKey[];
		searchWords: readonly string[];
		category: Category | null;
		maxPrice: number | null;
		shopIds: readonly ShopId[];
		mallOnly: boolean;
		simplified: boolean;
		sections: readonly SectionId[];
		priorities: Readonly<Partial<Record<PriorityKey, number>>>;
		specPreferences: Readonly<Partial<Record<SpecKey, Direction | null>>>;
	}>
>;

type PlanField = Exclude<keyof Plan, 'priorities' | 'specPreferences'>;
type ExplicitChoices = Readonly<{
	fields: readonly PlanField[];
	priorities: readonly PriorityKey[];
	specPreferences: readonly SpecKey[];
}>;

type StoreSnapshot = Readonly<{
	plan: Plan;
	explicit: ExplicitChoices;
}>;

type ListingReference = Readonly<{
	productId: Product['id'];
	field: 'summary' | 'review.0' | 'review.1' | `spec.${SpecKey}`;
}>;

type DropCode =
	| 'unknown-intent'
	| 'forbidden-command'
	| 'forbidden-patch'
	| 'unknown-field'
	| 'invalid-theme'
	| 'invalid-layout'
	| 'invalid-density'
	| 'invalid-language'
	| 'invalid-card-field'
	| 'invalid-section'
	| 'invalid-category'
	| 'invalid-budget'
	| 'invalid-shop'
	| 'invalid-spec'
	| 'invalid-priority'
	| 'invalid-search-word'
	| 'invalid-citation'
	| 'invalid-product';

type ProjectedTrace = Readonly<{
	backend: 'direct' | 'offline' | 'model';
	reason:
		| 'completed'
		| 'forced-offline'
		| 'missing-key'
		| 'provider-error'
		| 'timeout'
		| 'unusable-output';
	dropped: readonly DropCode[];
	guarded: boolean;
}>;

type TurnBase = Readonly<{
	reply: string;
	trace: ProjectedTrace;
}>;

type Turn =
	| (TurnBase & Readonly<{ intent: 'change'; patch: PlanPatch }>)
	| (TurnBase & Readonly<{ intent: 'ask'; citations: readonly ListingReference[] }>)
	| (TurnBase & Readonly<{ intent: 'deal'; productIds: readonly Product['id'][] }>)
	| (TurnBase & Readonly<{ intent: 'undo' }>)
	| (TurnBase & Readonly<{ intent: 'reset' }>)
	| (TurnBase & Readonly<{ intent: 'chat' }>);

type CartLine = Readonly<{
	productId: Product['id'];
	quantity: number;
}>;

type TurnEffect = 'applied' | 'no-op' | 'undone' | 'reset' | 'inert';
type StoreState = Readonly<{
	plan: Plan;
	explicit: ExplicitChoices;
	undo: readonly StoreSnapshot[];
	focusProductId: Product['id'] | null;
	cart: readonly CartLine[];
	lastTurn: Readonly<{
		turn: Turn;
		effect: TurnEffect;
		changedFields: readonly PlanField[];
	}> | null;
}>;

type RankStrength = 'full' | 'high' | 'medium' | 'low';
type RankTerm =
	| Readonly<{ kind: 'priority'; key: PriorityKey; strength: RankStrength }>
	| Readonly<{
			kind: 'spec';
			key: SpecKey;
			direction: Direction;
			strength: RankStrength;
	  }>;

type RankedProduct = Readonly<{
	product: Product;
	// Positive terms only, ordered strongest first.
	terms: readonly RankTerm[];
}>;
```

`Product`, `Category`, `ShopId` and `SpecKey` remain Owner 1 contracts. Numeric
ranking values are trusted local engine data and are never projected to the model
or returned to the UI. The UI receives ordered term keys and one of four named
strengths for digit-free labels and bars. Likewise, `Plan.maxPrice` and cart
quantities never enter the model projection.

## Shared sample expectations

Owner 4's `contractSample` should expose one source object for all three public
calls, with these named cases:

- `products`: includes the bilingual HomeKrua `cooker-one-button` record.
- `openingState`: standard English plan, focused on `cooker-one-button`, with the
  same product in the cart, `language` marked explicit and no undo snapshot.
- `mixedTurn`: validated change turn from a proposal containing `theme: 'minimal'`
  and section `unknown-section`. Its patch contains only the minimal theme and its
  closed trace records `invalid-section`.
- `directLanguageMessage`: asks for mom mode without an explicit language request.
  The state's direct English choice survives the persona's inferred Thai default.
- `noOpTurn`: a minimal-theme change applied after `mixedTurn`; it creates no
  additional undo snapshot.
- `undoMessage`: produces an `undo` intent that reverses `mixedTurn`, even after
  the no-op.
- `questionMessage`: asks for the focused cooker's capacity and produces an ask
  turn citing `{ productId: 'cooker-one-button', field: 'spec.capacity' }`.

No sample reply contains a digit, currency mark, markup or listing value. Facts are
resolved from the cited product only at the rendering boundary.

## Consumer decisions requested

Owner 3 should confirm `cardFields`, `searchWords`, `explicit`, `focusProductId`,
`cart`, `terms` and the `intent` discriminator before Owner 4 publishes the
baseline. Owner 3 also requested a public `turnFromControl` helper in Task 2 so
explicit controls use the same reducer without passing through natural language.
Owner 1 should confirm the four catalog type names, cart-line compatibility and
the `cooker-one-button` capacity reference.

The current storefront branches use `cooker-1`, while the approved Owner 4 fixture
requires `cooker-one-button`. The baseline must select one canonical ID; this
proposal follows the approved fixture and does not introduce an alias.
