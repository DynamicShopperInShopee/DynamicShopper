export type Locale = 'en' | 'th';
export type Localized = Readonly<Record<Locale, string>>;
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
export type FactUnit = 'baht' | 'g' | 'h' | 'Hz' | 'ms' | 'mAh' | 'W' | 'L' | 'yr' | 'ml' | null;
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

export type Fact = Readonly<{
	productId: string;
	field: string;
	raw: number | string | Localized;
	unit: FactUnit;
}>;
