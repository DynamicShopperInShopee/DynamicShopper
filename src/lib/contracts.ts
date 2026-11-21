export type Language = 'en' | 'th';
export type Locale = Language;
export type Localized = Readonly<Record<Language, string>>;

export type Category = 'mouse' | 'earbuds' | 'power-bank' | 'rice-cooker' | 'skincare';
export type ShopId = 'techhub' | 'gamerzone' | 'audiolab' | 'homekrua' | 'glow-skin';
export type SpecKey =
	| 'dpi'
	| 'weight'
	| 'battery'
	| 'pollingRate'
	| 'connection'
	| 'noiseCancelling'
	| 'latency'
	| 'capacity'
	| 'output'
	| 'power'
	| 'programs'
	| 'warranty'
	| 'volume'
	| 'spf'
	| 'skinType';

export type Scores = Readonly<Record<'performance' | 'durability' | 'design' | 'value', number>>;

export type Product = Readonly<{
	id: string;
	category: Category;
	shopId: ShopId;
	name: Localized;
	price: number;
	originalPrice?: number;
	rating: number;
	reviewCount: number;
	sold: number;
	shipping: number;
	specs: Readonly<Partial<Record<SpecKey, number | Localized>>>;
	summary: Localized;
	reviews: readonly [Localized, Localized];
	tags: readonly string[];
	scores: Scores;
}>;

export type FactUnit =
	| 'baht'
	| 'g'
	| 'h'
	| 'Hz'
	| 'ms'
	| 'mAh'
	| 'W'
	| 'L'
	| 'yr'
	| 'ml'
	| 'cm'
	| 'deg'
	| 's'
	| 'kg'
	| null;

export type Fact = Readonly<{
	productId: Product['id'];
	field: string;
	raw: number | string | Localized;
	unit: FactUnit;
}>;

export type BasketItem = Readonly<{
	productId: Product['id'];
	quantity: number;
}>;

export type PricingContext = Readonly<{
	openedAt: number;
	now: number;
	coinBalance?: number;
}>;

export type VoucherKind = 'shop' | 'platform' | 'shipping';
type VoucherLine = Readonly<{
	code: string;
	kind: VoucherKind;
	shopId?: string;
	expiresSoon: boolean;
}>;

export type AppliedVoucher = VoucherLine & Readonly<{ amount: number }>;

export type UnusedVoucher =
	| (VoucherLine & Readonly<{ reason: 'minimum-spend'; gap: number }>)
	| (VoucherLine &
			Readonly<{
				reason: 'expired' | 'no-eligible-item' | 'beaten';
				gap?: never;
			}>);

export type PricedItem = BasketItem &
	Readonly<{
		shopId: string;
		unitPrice: number;
		subtotal: number;
	}>;

export type ShopReceipt = Readonly<{
	shopId: string;
	items: readonly PricedItem[];
	subtotal: number;
	shipping: number;
}>;

export type DealReceipt = Readonly<{
	items: readonly PricedItem[];
	shops: readonly ShopReceipt[];
	subtotal: number;
	shipping: number;
	baseline: number;
	appliedVouchers: readonly AppliedVoucher[];
	coinsUsed: number;
	total: number;
	savings: number;
	unusedVouchers: readonly UnusedVoucher[];
}>;

export type AddOn = Readonly<{
	productId: Product['id'];
	extraCost: number;
	voucherCode: string;
}>;

export type Theme = 'standard' | 'minimal' | 'vibrant' | 'large-print';
export type Layout = 'grid' | 'list' | 'table';
export type Density = 'compact' | 'comfortable' | 'spacious';
export type Direction = 'higher' | 'lower';

export type CardField =
	'image' | 'price' | 'rating' | 'specs' | 'summary' | 'reviews' | 'shipping' | 'vouchers' | 'shop';

export type SectionId =
	'top-picks' | 'compare' | 'what-matters' | 'reviews' | 'best-deal' | 'share' | 'products';

export type PriorityKey = 'price' | 'performance' | 'durability' | 'design' | 'rating' | 'value';

export type Plan = Readonly<{
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

export type PlanPatch = Readonly<
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

export type PlanField = Exclude<keyof Plan, 'priorities' | 'specPreferences'>;
export type PlanChange =
	| Readonly<{ kind: 'field'; field: PlanField }>
	| Readonly<{ kind: 'priority'; key: PriorityKey }>
	| Readonly<{ kind: 'spec-preference'; key: SpecKey }>;

export type ExplicitChoices = Readonly<{
	fields: readonly PlanField[];
	priorities: readonly PriorityKey[];
	specPreferences: readonly SpecKey[];
}>;

export type StoreSnapshot = Readonly<{
	plan: Plan;
	explicit: ExplicitChoices;
}>;

export type ListingField = 'summary' | 'review.0' | 'review.1' | `spec.${SpecKey}`;
export type ListingReference = Readonly<{
	productId: Product['id'];
	field: ListingField;
}>;

export type DropCode =
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

export type TraceReason =
	'completed' | 'forced-offline' | 'missing-key' | 'provider-error' | 'timeout' | 'unusable-output';

export type ToolTrace = Readonly<{
	kind: 'catalog-search' | 'listing-read';
	resultCount: number;
	elapsedMs: number;
}>;

export type ProjectedTrace = Readonly<{
	backend: 'direct' | 'offline' | 'model';
	reason: TraceReason;
	model?: string;
	tools: readonly ToolTrace[];
	rounds: number;
	elapsedMs: number;
	usage?: Readonly<{
		inputTokens: number;
		outputTokens: number;
	}>;
	dropped: readonly DropCode[];
	guarded: boolean;
}>;

type TurnBase = Readonly<{
	reply: string;
	trace: ProjectedTrace;
}>;

export type Turn =
	| (TurnBase & Readonly<{ intent: 'change'; patch: PlanPatch }>)
	| (TurnBase & Readonly<{ intent: 'ask'; citations: readonly ListingReference[] }>)
	| (TurnBase & Readonly<{ intent: 'deal'; productIds: readonly Product['id'][] }>)
	| (TurnBase & Readonly<{ intent: 'undo' }>)
	| (TurnBase & Readonly<{ intent: 'reset' }>)
	| (TurnBase & Readonly<{ intent: 'chat' }>);

export type TurnEffect = 'applied' | 'no-op' | 'undone' | 'reset' | 'inert';

export type StoreState = Readonly<{
	plan: Plan;
	explicit: ExplicitChoices;
	undo: readonly StoreSnapshot[];
	focusProductId: Product['id'] | null;
	cart: readonly BasketItem[];
	lastTurn: Readonly<{
		turn: Turn;
		effect: TurnEffect;
		changes: readonly PlanChange[];
	}> | null;
}>;

export type RankStrength = 'full' | 'high' | 'medium' | 'low';

export type RankTerm =
	| Readonly<{
			kind: 'priority';
			key: PriorityKey;
			strength: RankStrength;
	  }>
	| Readonly<{
			kind: 'spec';
			key: SpecKey;
			direction: Direction;
			strength: RankStrength;
	  }>;

export type RankedProduct = Readonly<{
	product: Product;
	terms: readonly RankTerm[];
}>;
