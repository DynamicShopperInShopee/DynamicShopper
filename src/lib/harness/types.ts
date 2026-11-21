import type { Category, Locale, Localized, ShopId, SpecKey } from '../catalog/index.ts';

export type { Category, Locale, Localized, ShopId, SpecKey };

export const THEMES = ['standard', 'minimal', 'vibrant', 'large-print'] as const;
export const LAYOUTS = ['grid', 'list', 'table'] as const;
export const DENSITIES = ['compact', 'comfortable', 'spacious'] as const;
export const LANGUAGES = ['en', 'th'] as const;
export const CARD_FIELDS = [
	'image',
	'price',
	'rating',
	'specs',
	'summary',
	'reviews',
	'shipping',
	'vouchers',
	'shop'
] as const;
export const PRIORITIES = [
	'price',
	'performance',
	'durability',
	'design',
	'rating',
	'value'
] as const;
export const SECTIONS = [
	'top-picks',
	'compare',
	'what-matters',
	'reviews',
	'best-deal',
	'share',
	'products'
] as const;
export const PERSONAS = ['standard', 'tech', 'visual', 'mom'] as const;
export const LEVELS = ['none', 'low', 'medium', 'high'] as const;
export const INTENTS = [
	'restyle',
	'search',
	'find_deal',
	'persona',
	'reset',
	'undo',
	'ask',
	'chat'
] as const;

export type Theme = (typeof THEMES)[number];
export type Layout = (typeof LAYOUTS)[number];
export type Density = (typeof DENSITIES)[number];
export type Language = (typeof LANGUAGES)[number];
export type CardField = (typeof CARD_FIELDS)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Section = (typeof SECTIONS)[number];
export type Persona = (typeof PERSONAS)[number];
export type Level = (typeof LEVELS)[number];
export type Intent = (typeof INTENTS)[number];
export type Direction = 'higher' | 'lower';

export type SpecPreference = Readonly<{ key: SpecKey; direction: Direction }>;

export type Filters = Readonly<{
	category: Category | null;
	/** Whole baht, set only by the shopper's own words or controls, never by a model. */
	maxPrice: number | null;
	shops: readonly ShopId[];
	mallOnly: boolean;
}>;

/** The complete description of how one shopper's store looks. Holds no facts. */
export type Plan = Readonly<{
	theme: Theme;
	layout: Layout;
	density: Density;
	language: Language;
	cardFields: readonly CardField[];
	highlightSpecs: readonly SpecKey[];
	query: string;
	priorities: Readonly<Record<Priority, number>>;
	specPrefs: readonly SpecPreference[];
	filters: Filters;
	simplified: boolean;
	sections: readonly Section[];
}>;

/** A validated partial change. `null` in a filter means "clear it". */
export type PlanPatch = Readonly<{
	theme?: Theme;
	layout?: Layout;
	density?: Density;
	language?: Language;
	cardFields?: readonly CardField[];
	highlightSpecs?: readonly SpecKey[];
	query?: string;
	priorities?: Readonly<Partial<Record<Priority, number>>>;
	specPrefs?: readonly SpecPreference[];
	filters?: Readonly<{
		category?: Category | null;
		maxPrice?: number | null;
		shops?: readonly ShopId[];
		mallOnly?: boolean;
	}>;
	simplified?: boolean;
	sections?: readonly Section[];
}>;

/** Plan parts tracked for explicit precedence, chips and diffs. */
export const PLAN_PARTS = [
	'theme',
	'layout',
	'density',
	'language',
	'cardFields',
	'highlightSpecs',
	'query',
	'priorities',
	'specPrefs',
	'filters.category',
	'filters.maxPrice',
	'filters.shops',
	'filters.mallOnly',
	'simplified',
	'sections'
] as const;
export type PlanPart = (typeof PLAN_PARTS)[number];

/** Closed list of reasons a proposed part was refused. Shown in X-ray. */
export const DROP_CODES = [
	'unknown_value',
	'unknown_field',
	'not_in_category',
	'not_numeric',
	'unknown_product',
	'unknown_shop',
	'empty_list',
	'search_has_number',
	'search_no_match',
	'model_number',
	'explicit_wins',
	'ignored_for_intent',
	'duplicate',
	'too_many',
	'invalid_citation',
	'invalid_shape'
] as const;
export type DropCode = (typeof DROP_CODES)[number];

/** Where a dropped piece sat. Never echoes a model-chosen key. */
export const DROP_PLACES = [
	...PLAN_PARTS,
	'intent',
	'persona',
	'citation',
	'productId',
	'unknown'
] as const;
export type DropPlace = (typeof DROP_PLACES)[number];
export type Drop = Readonly<{ place: DropPlace; code: DropCode }>;

export type CitationKind = 'spec' | 'review' | 'summary';
export type Citation = Readonly<{
	productId: string;
	kind: CitationKind;
	/** Spec key for `spec`, `0`/`1` for `review`, `summary` for `summary`. */
	key: string;
}>;

export type Source = 'explicit' | 'inferred';

export type Reply = Readonly<{ lang: Language; text: string }>;

export type FallbackReason =
	| 'no_key'
	| 'forced_offline'
	| 'api_error'
	| 'refusal'
	| 'timeout'
	| 'deadline'
	| 'too_many_rounds'
	| 'output_cut'
	| 'invalid_output';

export type Backend = 'model' | 'offline';

/** The validated, intent-specific outcome of one shopper message. */
export type Turn =
	| Readonly<{ intent: 'restyle' | 'search'; patch: PlanPatch; reply: Reply }>
	| Readonly<{ intent: 'persona'; persona: Persona; patch: PlanPatch; reply: Reply }>
	| Readonly<{ intent: 'find_deal'; productIds: readonly string[]; reply: Reply }>
	| Readonly<{ intent: 'ask'; citations: readonly Citation[]; reply: Reply }>
	| Readonly<{ intent: 'undo' | 'reset' | 'chat'; reply: Reply }>;

export type Suggestion = Readonly<{
	id: SignalKind;
	patch: PlanPatch;
	/** How many matching signals were seen this session. Never shown as a digit by the harness. */
	evidence: number;
}>;

export const SIGNAL_KINDS = [
	'open_compare',
	'open_specs',
	'open_reviews',
	'zoom_text',
	'sort_price',
	'open_deal'
] as const;
export type SignalKind = (typeof SIGNAL_KINDS)[number];
export type Signal = Readonly<{ kind: SignalKind; at: number }>;

export type UndoEntry = Readonly<{ plan: Plan; explicit: readonly PlanPart[] }>;

export type StoreState = Readonly<{
	plan: Plan;
	explicit: readonly PlanPart[];
	undo: readonly UndoEntry[];
	focus: readonly string[];
	cart: readonly string[];
	viewed: readonly string[];
	signals: readonly Signal[];
	suggestions: readonly Suggestion[];
	dismissed: readonly SignalKind[];
}>;

export type ChangeLine = Readonly<{ part: PlanPart; text: string }>;
