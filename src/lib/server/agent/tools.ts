import type { Product } from '#lib/catalog/index.ts';
import { matchProducts, queryWords } from '#lib/harness/plan.ts';
import { maskAmounts } from '#lib/harness/budget.ts';
import { findProduct, isCategory, type CatalogPort } from '#lib/harness/catalog-port.ts';
import type { Category } from '#lib/harness/types.ts';
import type { ToolSpec } from './transport.ts';

export const MAX_SEARCH_RESULTS = 10;
export const MAX_LISTINGS = 3;

export function toolSpecs(catalog: CatalogPort): ToolSpec[] {
	return [
		{
			name: 'search_catalog',
			description:
				'Find products by words and category. Returns names, categories and tags only. Set withinBudget to apply the shopper budget, which the store keeps privately.',
			parameters: {
				type: 'object',
				properties: {
					words: { type: 'string', description: 'Search words in Thai or English.' },
					category: { type: ['string', 'null'], enum: [...Object.keys(catalog.categories), null] },
					withinBudget: { type: 'boolean' }
				},
				required: ['words', 'category', 'withinBudget'],
				additionalProperties: false
			}
		},
		{
			name: 'read_listing',
			description:
				'Read the specs, review quotes and summary of products by id. At most three listings per message, including those already in focus.',
			parameters: {
				type: 'object',
				properties: { productIds: { type: 'array', items: { type: 'string' } } },
				required: ['productIds'],
				additionalProperties: false
			}
		}
	];
}

/** Model-written prose and arguments are masked before they are echoed back to the model. */
const clean = (value: unknown, max = 60) =>
	typeof value === 'string' ? maskAmounts(value.normalize('NFC')).slice(0, max) : '';

export type SearchArgs = Readonly<{
	words: string;
	category: Category | null;
	withinBudget: boolean;
}>;

/** Read leniently: anything unknown is ignored rather than trusted. */
export function parseSearchArgs(raw: string, catalog: CatalogPort): SearchArgs {
	let input: Record<string, unknown> = {};
	try {
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed === 'object' && parsed !== null) input = parsed as Record<string, unknown>;
	} catch {
		// Malformed arguments search nothing in particular.
	}
	return {
		words: clean(input.words),
		category: isCategory(catalog, input.category) ? input.category : null,
		withinBudget: input.withinBudget === true
	};
}

export function parseReadArgs(raw: string, catalog: CatalogPort): string[] {
	try {
		const parsed: unknown = JSON.parse(raw);
		const ids = (parsed as { productIds?: unknown })?.productIds;
		if (!Array.isArray(ids)) return [];
		return ids
			.map((id) => findProduct(catalog, id)?.id)
			.filter((id): id is string => !!id)
			.filter((id, index, list) => list.indexOf(id) === index)
			.slice(0, 10);
	} catch {
		return [];
	}
}

export type SearchHit = Readonly<{
	id: string;
	name: Readonly<{ en: string; th: string }>;
	category: Category;
	tags: readonly string[];
}>;

const hit = (product: Product): SearchHit => ({
	id: product.id,
	name: { en: product.name.en, th: product.name.th },
	category: product.category,
	tags: [...product.tags]
});

/**
 * Pure catalog search. The budget is applied here, on the store's side, from the shopper's own
 * words; the model only says whether to apply it. Results never carry a price.
 */
export function searchCatalog(
	catalog: CatalogPort,
	args: SearchArgs,
	budget: number | null
): SearchHit[] {
	const filters = {
		category: args.category,
		maxPrice: args.withinBudget ? budget : null,
		shops: [],
		mallOnly: false
	};
	let found = matchProducts(catalog, filters, args.words);
	if (found.length === 0 && args.words !== '') {
		// Fall back to any single word so a loose phrase still finds something.
		const ids = new Set(
			queryWords(args.words).flatMap((word) =>
				matchProducts(catalog, filters, word).map((p) => p.id)
			)
		);
		found = catalog.products.filter((product) => ids.has(product.id));
	}
	return found.slice(0, MAX_SEARCH_RESULTS).map(hit);
}

export type Listing = Readonly<{
	id: string;
	name: Readonly<{ en: string; th: string }>;
	category: Category;
	specs: Readonly<Record<string, string>>;
	summary: string;
	reviews: readonly string[];
}>;

/**
 * Specs, reviews and summary in the shopper's language. Never price, original price, shipping,
 * units sold, rating or review count. Prose is masked so a price mentioned in a review cannot pass.
 */
export function readListing(catalog: CatalogPort, id: string, lang: 'en' | 'th'): Listing | null {
	const product = findProduct(catalog, id);
	if (!product) return null;
	const specs: Record<string, string> = {};
	for (const definition of catalog.specs[product.category]) {
		const value = product.specs[definition.key];
		if (value === undefined) continue;
		specs[definition.key] =
			typeof value === 'object'
				? value[lang]
				: `${value}${definition.unit ? ` ${definition.unit}` : ''}`;
	}
	return {
		id: product.id,
		name: { en: product.name.en, th: product.name.th },
		category: product.category,
		specs,
		summary: clean(product.summary[lang], 300),
		reviews: product.reviews.map((review) => clean(review[lang], 300))
	};
}
