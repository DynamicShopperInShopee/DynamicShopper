import { CatalogInputError } from './validate.ts';

export type CatalogQuery = Readonly<{
	q: string;
	category: string;
	sort: 'catalog' | 'price-low' | 'price-high';
	maxPrice: number | null;
	page: number;
	pageSize: number;
}>;

function integer(params: URLSearchParams, key: string, fallback: number, maximum: number) {
	const value = params.get(key);
	if (value === null) return fallback;
	if (!/^\d+$/.test(value)) throw new CatalogInputError(`${key} must be a positive integer`);
	const number = Number(value);
	if (!Number.isSafeInteger(number) || number < 1 || number > maximum)
		throw new CatalogInputError(`${key} is outside its allowed range`);
	return number;
}

export function parseCatalogQuery(params: URLSearchParams): CatalogQuery {
	for (const key of params.keys()) {
		if (
			!['q', 'category', 'sort', 'maxPrice', 'page', 'pageSize'].includes(key) ||
			params.getAll(key).length !== 1
		)
			throw new CatalogInputError('Unknown or repeated catalog query parameter');
	}
	const q = (params.get('q') ?? '').trim();
	if (q.length > 256 || Array.from(q).some((character) => character.charCodeAt(0) < 32))
		throw new CatalogInputError('q is too long or contains unsupported control characters');
	const category = params.get('category') ?? 'all';
	if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(category))
		throw new CatalogInputError('category is invalid');
	const sort = params.get('sort') ?? 'catalog';
	if (sort !== 'catalog' && sort !== 'price-low' && sort !== 'price-high')
		throw new CatalogInputError('sort is invalid');
	return {
		q,
		category,
		sort,
		maxPrice: params.has('maxPrice')
			? integer(params, 'maxPrice', 1, Number.MAX_SAFE_INTEGER)
			: null,
		page: integer(params, 'page', 1, 1_000_000),
		pageSize: integer(params, 'pageSize', 24, 100)
	};
}
