import { catalog, categories, type Category } from './store-catalog';

export { catalog };

export type Sort = 'default' | 'price-low' | 'price-high' | 'top-rated' | 'top-sales';

interface SearchOptions {
	query?: string;
	category?: Category | 'all';
	maxPrice?: number;
	freeShipping?: boolean;
	sort?: Sort;
}

const numberFormat = new Intl.NumberFormat('en-TH');
export const formatNumber = (value: number) => numberFormat.format(value);
export const formatBaht = (value: number) => `฿${formatNumber(value)}`;

export function searchProducts({
	query = '',
	category = 'all',
	maxPrice,
	freeShipping = false,
	sort = 'default'
}: SearchOptions = {}) {
	const words = query.normalize('NFC').toLowerCase().trim().split(/\s+/).filter(Boolean);
	const matches = catalog.filter((product) => {
		if (category !== 'all' && product.category !== category) return false;
		if (maxPrice !== undefined && product.price > maxPrice) return false;
		if (freeShipping && product.shipping !== 0) return false;

		const labels = categories[product.category];
		const text = [product.name.en, product.name.th, product.shop, labels.en, labels.th]
			.join(' ')
			.normalize('NFC')
			.toLowerCase();
		return words.every((word) => text.includes(word));
	});

	switch (sort) {
		case 'price-low':
			return matches.sort((a, b) => a.price - b.price);
		case 'price-high':
			return matches.sort((a, b) => b.price - a.price);
		case 'top-sales':
			return matches.sort((a, b) => b.sold - a.sold);
		case 'top-rated':
			return matches.sort((a, b) => b.rating - a.rating);
		default:
			return matches;
	}
}
