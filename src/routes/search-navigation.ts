import { onNavigate, replaceState } from '$app/navigation';
import { page } from '$app/state';
import { products } from '../lib/catalog';
import { categories, type Category, type Language } from '../lib/store-catalog';
import type { Sort } from '../lib/store-search';

export const searchLimit = 256;
export type SearchSelection = {
	category: Category | 'all';
	language: Language;
	sort: Sort;
	query: string;
	draftQuery: string;
	maxPrice?: number;
	freeShipping: boolean;
	capacity?: number;
	scrollY?: number;
};

const sorts: readonly Sort[] = ['default', 'price-low', 'price-high', 'top-rated', 'top-sales'];
const capacities = new Set(
	products.filter((item) => item.category === 'rice-cooker').map((item) => item.specs.capacity)
);

export function readSearchSelection(input: unknown): SearchSelection | undefined {
	if (!input || typeof input !== 'object') return;
	const value = input as Partial<SearchSelection>;
	if (
		(value.category !== 'all' &&
			(typeof value.category !== 'string' || !Object.hasOwn(categories, value.category))) ||
		(value.language !== 'en' && value.language !== 'th') ||
		value.sort === undefined ||
		!sorts.includes(value.sort) ||
		typeof value.query !== 'string' ||
		value.query.length > searchLimit ||
		typeof value.draftQuery !== 'string' ||
		value.draftQuery.length > searchLimit ||
		typeof value.freeShipping !== 'boolean' ||
		(value.scrollY !== undefined && (!Number.isSafeInteger(value.scrollY) || value.scrollY < 0)) ||
		(value.maxPrice !== undefined &&
			(!Number.isSafeInteger(value.maxPrice) || value.maxPrice < 0)) ||
		(value.capacity !== undefined &&
			(typeof value.capacity !== 'number' || !capacities.has(value.capacity)))
	)
		return;
	return {
		category: value.category,
		language: value.language,
		sort: value.sort,
		query: value.query,
		draftQuery: value.draftQuery,
		maxPrice: value.maxPrice,
		freeShipping: value.freeShipping,
		capacity: value.capacity,
		scrollY: value.scrollY
	};
}

// Keep the originating shelf on this tab's listing history entry, including seller and language links.
export function carrySearchToListing(read: () => SearchSelection | undefined) {
	onNavigate(({ to, type }) => {
		if (type === 'popstate' || to?.route.id !== '/product/[id]') return;
		const selection = read();
		if (!selection) return;
		return () => {
			void replaceState(page.url.href, { ...page.state, storeSearch: selection });
		};
	});
}
