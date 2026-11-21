import type { Category, Locale, ShopId, SpecKey } from '../catalog';

export const themes = ['standard', 'minimal', 'vibrant', 'large-print'] as const;
export const layouts = ['grid', 'list', 'table'] as const;
export const densities = ['compact', 'comfortable', 'spacious'] as const;
export const locales = ['en', 'th'] as const;
export const details = [
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
export const sections = [
	'top-picks',
	'compare',
	'what-matters',
	'reviews',
	'best-deal',
	'share',
	'products'
] as const;
export const priorities = [
	'price',
	'performance',
	'durability',
	'design',
	'rating',
	'value'
] as const;
export const directions = ['higher', 'lower'] as const;

export type ShopperPlan = {
	theme: (typeof themes)[number];
	layout: (typeof layouts)[number];
	density: (typeof densities)[number];
	locale: Locale;
	details: (typeof details)[number][];
	highlightedSpecs: SpecKey[];
	query: string;
	category: Category | null;
	maxPrice: number | null;
	shops: ShopId[];
	mallOnly: boolean;
	simplified: boolean;
	sections: (typeof sections)[number][];
	priorities: Partial<Record<(typeof priorities)[number], number>>;
	specPreferences: Partial<Record<SpecKey, (typeof directions)[number]>>;
};

export const defaultPlan: ShopperPlan = {
	theme: 'standard',
	layout: 'grid',
	density: 'comfortable',
	locale: 'en',
	details: ['image', 'price', 'rating', 'shop', 'shipping'],
	highlightedSpecs: [],
	query: '',
	category: null,
	maxPrice: null,
	shops: [],
	mallOnly: false,
	simplified: false,
	sections: ['products'],
	priorities: { rating: 1, value: 0.5 },
	specPreferences: {}
};

export function personaPlan(
	persona: 'standard' | 'tech' | 'visual' | 'mom',
	locale: Locale = 'en'
): ShopperPlan {
	const plan = structuredClone(defaultPlan);
	plan.locale = locale;
	switch (persona) {
		case 'tech':
			return {
				...plan,
				theme: 'minimal',
				layout: 'table',
				density: 'compact',
				details: ['price', 'specs', 'rating', 'shop'],
				priorities: { performance: 1, value: 0.5 },
				sections: ['what-matters', 'products']
			};
		case 'visual':
			return {
				...plan,
				theme: 'vibrant',
				density: 'spacious',
				details: ['image', 'price', 'summary', 'reviews', 'vouchers'],
				priorities: { design: 1, rating: 0.5 },
				sections: ['top-picks', 'reviews', 'products']
			};
		case 'mom':
			return {
				...plan,
				theme: 'large-print',
				layout: 'list',
				density: 'spacious',
				locale: 'th',
				details: ['image', 'price', 'summary', 'shipping'],
				priorities: { rating: 1, durability: 0.5 },
				simplified: true,
				sections: ['top-picks', 'what-matters', 'best-deal', 'share', 'products']
			};
		default:
			return plan;
	}
}
