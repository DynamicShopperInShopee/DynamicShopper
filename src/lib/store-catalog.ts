import { getShop, products, type Category as CatalogCategory, type Locale } from './catalog';

export const categories = {
	mouse: { en: 'Gaming mice', th: 'เมาส์เกมมิ่ง' },
	earbuds: { en: 'Earbuds', th: 'หูฟัง' },
	power: { en: 'Power banks', th: 'พาวเวอร์แบงก์' },
	cooker: { en: 'Rice cookers', th: 'หม้อหุงข้าว' },
	skin: { en: 'Skincare', th: 'สกินแคร์' }
} as const;

export type Category = keyof typeof categories;
export type Language = Locale;

const displayCategory: Record<CatalogCategory, Category> = {
	mouse: 'mouse',
	earbuds: 'earbuds',
	'power-bank': 'power',
	'rice-cooker': 'cooker',
	skincare: 'skin'
};

// Keep the event demo's model IDs and art positions as products gain canonical IDs.
const modelIds = {
	mouse: [
		'nova-lite',
		'vortex-w',
		'aero-x',
		'blaze-pro',
		'titan-max',
		'rogue-o',
		'ergo-g',
		'pixel-mini'
	],
	earbuds: [
		'quietbuds-pro',
		'playlite',
		'sportfit',
		'studio-x',
		'dailymini',
		'neo-anc',
		'clearcall'
	],
	power: ['slimcharge', 'fastpd', 'maggo', 'megapower', 'ecobank', 'solartrek'],
	cooker: [
		'cooker-one-button',
		'cooker-digital',
		'cooker-family',
		'cooker-mini',
		'cooker-ih',
		'cooker-steamer'
	],
	skin: [
		'sunscreen-spf50',
		'vitamin-c-serum',
		'oil-control-gel',
		'ceramide-moisturiser',
		'sunscreen-spf35',
		'hyaluronic-masks'
	]
};
const models = Object.entries(modelIds).flatMap(([category, ids]) =>
	ids.map((catalogId, index) => ({ catalogId, id: `${category}-${index + 1}` }))
);
const legacyModels = new Map(models.map(({ catalogId, id }, order) => [catalogId, { id, order }]));

export const catalog = [...products]
	.sort(
		(a, b) =>
			(legacyModels.get(a.id)?.order ?? models.length) -
			(legacyModels.get(b.id)?.order ?? models.length)
	)
	.map((product) => ({
		id: legacyModels.get(product.id)?.id ?? product.id,
		catalogId: product.id,
		category: displayCategory[product.category],
		name: product.name,
		shop: getShop(product.shopId)?.name.en ?? product.shopId,
		price: product.price,
		originalPrice: product.originalPrice ?? null,
		rating: product.rating,
		sold: product.sold,
		shipping: product.shipping
	}));
