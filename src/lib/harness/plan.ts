import type { Product } from '../catalog/index.ts';
import {
	findProduct,
	findShop,
	isCategory,
	specDefinition,
	type CatalogPort
} from './catalog-port.ts';
import {
	CARD_FIELDS,
	DENSITIES,
	LANGUAGES,
	LAYOUTS,
	LEVELS,
	PRIORITIES,
	SECTIONS,
	THEMES,
	type CardField,
	type Category,
	type Drop,
	type DropCode,
	type DropPlace,
	type Filters,
	type Level,
	type Persona,
	type Plan,
	type PlanPart,
	type PlanPatch,
	type Priority,
	type Section,
	type ShopId,
	type SpecKey,
	type SpecPreference
} from './types.ts';

export const MAX_SECTIONS = 7;
export const MAX_QUERY_LENGTH = 60;

const zeroPriorities: Record<Priority, number> = {
	price: 0,
	performance: 0,
	durability: 0,
	design: 0,
	rating: 0,
	value: 0
};

/** Enumerated priority levels a model may choose; the local side maps them to weights. */
export const LEVEL_WEIGHT: Readonly<Record<Level, number>> = {
	none: 0,
	low: 0.33,
	medium: 0.66,
	high: 1
};

const standard: Plan = {
	theme: 'standard',
	layout: 'grid',
	density: 'comfortable',
	language: 'en',
	cardFields: ['image', 'price', 'rating', 'shop', 'shipping'],
	highlightSpecs: [],
	query: '',
	priorities: { ...zeroPriorities, rating: 1, value: 0.66 },
	specPrefs: [],
	filters: { category: null, maxPrice: null, shops: [], mallOnly: false },
	simplified: false,
	sections: ['products']
};
export const standardPlan: Plan = Object.freeze(standard);

/** Each persona changes only what defines it. Filters, search and spec preferences are kept. */
export const personaPatches: Readonly<Record<Persona, PlanPatch>> = {
	standard: {
		theme: 'standard',
		layout: 'grid',
		density: 'comfortable',
		cardFields: standardPlan.cardFields,
		highlightSpecs: [],
		priorities: standardPlan.priorities,
		simplified: false,
		sections: ['products']
	},
	tech: {
		theme: 'minimal',
		layout: 'table',
		density: 'compact',
		cardFields: ['price', 'specs', 'rating', 'shop'],
		priorities: { ...zeroPriorities, performance: 1, value: 0.66 },
		simplified: false,
		sections: ['what-matters', 'products']
	},
	visual: {
		theme: 'vibrant',
		layout: 'grid',
		density: 'spacious',
		cardFields: ['image', 'price', 'summary', 'reviews', 'vouchers'],
		priorities: { ...zeroPriorities, design: 1, rating: 0.66 },
		simplified: false,
		sections: ['top-picks', 'reviews', 'products']
	},
	mom: {
		theme: 'large-print',
		layout: 'list',
		density: 'spacious',
		language: 'th',
		cardFields: ['image', 'price', 'summary', 'shipping'],
		priorities: { ...zeroPriorities, rating: 1, durability: 0.66 },
		simplified: true,
		sections: ['top-picks', 'what-matters', 'best-deal', 'share', 'products']
	}
};

const normalizeText = (value: string) => value.normalize('NFC').toLowerCase();

export function queryWords(query: string): string[] {
	return normalizeText(query).trim().split(/\s+/).filter(Boolean);
}

/** Products that pass the plan's filters and every search word. Deterministic, catalog-only. */
export function matchProducts(
	catalog: CatalogPort,
	filters: Filters,
	query: string
): readonly Product[] {
	const words = queryWords(query);
	const mallShops = new Set(catalog.shops.filter((shop) => shop.mall).map((shop) => shop.id));
	return catalog.products.filter((product) => {
		if (filters.category && product.category !== filters.category) return false;
		if (filters.maxPrice !== null && product.price > filters.maxPrice) return false;
		if (filters.shops.length > 0 && !filters.shops.includes(product.shopId)) return false;
		if (filters.mallOnly && !mallShops.has(product.shopId)) return false;
		if (words.length === 0) return true;
		const label = catalog.categories[product.category];
		const haystack = normalizeText(
			[product.name.en, product.name.th, label.en, label.th, ...product.tags].join(' ')
		);
		return words.every((word) => haystack.includes(word));
	});
}

/** The category the shopper is looking at: the filter, else the single category left by the search. */
export function activeCategory(catalog: CatalogPort, plan: Plan): Category | null {
	if (plan.filters.category) return plan.filters.category;
	const seen = new Set(
		matchProducts(catalog, { ...plan.filters, maxPrice: null }, plan.query).map((p) => p.category)
	);
	return seen.size === 1 ? [...seen][0] : null;
}

const MONEYISH = /[\p{Nd}\p{Sc}]|baht|บาท|thb|usd/iu;

export type PatchSource = 'model' | 'local';

export type ValidationResult = Readonly<{ patch: PlanPatch; dropped: readonly Drop[] }>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const oneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
	typeof value === 'string' && (list as readonly string[]).includes(value);

const PATCH_KEYS = new Set([
	'theme',
	'layout',
	'density',
	'language',
	'cardFields',
	'highlightSpecs',
	'query',
	'priorities',
	'specPrefs',
	'filters',
	'simplified',
	'sections'
]);
const FILTER_KEYS = new Set(['category', 'maxPrice', 'shops', 'mallOnly']);

/**
 * Validate a proposed change part by part. Every invalid part is dropped on its own with a
 * closed reason code; valid siblings survive. The result always merges into a valid plan.
 * Model proposals may not carry numbers: priorities are levels and budgets are refused.
 */
export function validatePatch(
	raw: unknown,
	plan: Plan,
	catalog: CatalogPort,
	source: PatchSource
): ValidationResult {
	const dropped: Drop[] = [];
	const drop = (place: DropPlace, code: DropCode) => dropped.push({ place, code });
	if (raw === undefined || raw === null) return { patch: {}, dropped };
	if (!isRecord(raw)) {
		drop('unknown', 'invalid_shape');
		return { patch: {}, dropped };
	}

	const patch: {
		-readonly [K in keyof PlanPatch]: PlanPatch[K];
	} = {};

	for (const key of Object.keys(raw)) if (!PATCH_KEYS.has(key)) drop('unknown', 'unknown_field');

	const enumPart = <T extends string>(
		key: 'theme' | 'layout' | 'density' | 'language',
		list: readonly T[]
	): T | undefined => {
		if (!Object.hasOwn(raw, key)) return undefined;
		if (oneOf(list, raw[key])) return raw[key];
		drop(key, 'unknown_value');
		return undefined;
	};
	const theme = enumPart('theme', THEMES);
	if (theme) patch.theme = theme;
	const layout = enumPart('layout', LAYOUTS);
	if (layout) patch.layout = layout;
	const density = enumPart('density', DENSITIES);
	if (density) patch.density = density;
	const language = enumPart('language', LANGUAGES);
	if (language) patch.language = language;

	// Filters first: the category they choose decides which specs are valid below.
	let targetCategory: Category | null = activeCategory(catalog, plan);
	if (Object.hasOwn(raw, 'filters')) {
		const filters = raw.filters;
		if (!isRecord(filters)) drop('filters.category', 'invalid_shape');
		else {
			const next: {
				-readonly [K in keyof NonNullable<PlanPatch['filters']>]: NonNullable<
					PlanPatch['filters']
				>[K];
			} = {};
			for (const key of Object.keys(filters))
				if (!FILTER_KEYS.has(key)) drop('unknown', 'unknown_field');
			if (Object.hasOwn(filters, 'category')) {
				const value = filters.category;
				if (value === null) {
					next.category = null;
					targetCategory = null;
				} else if (isCategory(catalog, value)) {
					next.category = value;
					targetCategory = value;
				} else drop('filters.category', 'unknown_value');
			}
			if (Object.hasOwn(filters, 'maxPrice')) {
				const value = filters.maxPrice;
				if (value === null) next.maxPrice = null;
				else if (source === 'model') drop('filters.maxPrice', 'model_number');
				else if (typeof value === 'number' && Number.isFinite(value) && Math.floor(value) >= 1)
					next.maxPrice = Math.floor(value);
				else drop('filters.maxPrice', 'unknown_value');
			}
			if (Object.hasOwn(filters, 'shops')) {
				const value = filters.shops;
				if (!Array.isArray(value)) drop('filters.shops', 'invalid_shape');
				else {
					const shops: ShopId[] = [];
					for (const id of value) {
						const shop = findShop(catalog, id);
						if (!shop) drop('filters.shops', 'unknown_shop');
						else if (shops.includes(shop.id)) drop('filters.shops', 'duplicate');
						else shops.push(shop.id);
					}
					// An emptied list from invalid ids is ignored; an explicit [] clears the filter.
					if (shops.length > 0 || value.length === 0) next.shops = shops;
				}
			}
			if (Object.hasOwn(filters, 'mallOnly')) {
				if (typeof filters.mallOnly === 'boolean') next.mallOnly = filters.mallOnly;
				else drop('filters.mallOnly', 'invalid_shape');
			}
			if (Object.keys(next).length > 0) patch.filters = next;
		}
	}

	if (Object.hasOwn(raw, 'cardFields')) {
		const value = raw.cardFields;
		if (!Array.isArray(value)) drop('cardFields', 'invalid_shape');
		else {
			const fields: CardField[] = [];
			for (const field of value) {
				if (!oneOf(CARD_FIELDS, field)) drop('cardFields', 'unknown_value');
				else if (fields.includes(field)) drop('cardFields', 'duplicate');
				else fields.push(field);
			}
			// An empty list would blank every card, so it is ignored.
			if (fields.length === 0) drop('cardFields', 'empty_list');
			else patch.cardFields = fields;
		}
	}

	if (Object.hasOwn(raw, 'highlightSpecs')) {
		const value = raw.highlightSpecs;
		if (!Array.isArray(value)) drop('highlightSpecs', 'invalid_shape');
		else {
			const keys: SpecKey[] = [];
			for (const key of value) {
				const definition = targetCategory && specDefinition(catalog, targetCategory, key);
				if (!definition) drop('highlightSpecs', 'not_in_category');
				else if (keys.includes(definition.key)) drop('highlightSpecs', 'duplicate');
				else keys.push(definition.key);
			}
			if (keys.length > 0 || value.length === 0) patch.highlightSpecs = keys;
		}
	}

	if (Object.hasOwn(raw, 'specPrefs')) {
		const value = raw.specPrefs;
		if (!Array.isArray(value)) drop('specPrefs', 'invalid_shape');
		else {
			const prefs: SpecPreference[] = [];
			for (const item of value) {
				if (!isRecord(item)) {
					drop('specPrefs', 'invalid_shape');
					continue;
				}
				const definition = targetCategory && specDefinition(catalog, targetCategory, item.key);
				if (!definition) drop('specPrefs', 'not_in_category');
				else if (!definition.direction) drop('specPrefs', 'not_numeric');
				else if (item.direction !== 'higher' && item.direction !== 'lower')
					drop('specPrefs', 'unknown_value');
				else if (prefs.some((pref) => pref.key === definition.key)) drop('specPrefs', 'duplicate');
				else prefs.push({ key: definition.key, direction: item.direction });
			}
			if (prefs.length > 0 || value.length === 0) patch.specPrefs = prefs;
		}
	}

	if (Object.hasOwn(raw, 'priorities')) {
		const value = raw.priorities;
		if (!isRecord(value)) drop('priorities', 'invalid_shape');
		else {
			const next: Partial<Record<Priority, number>> = {};
			for (const [key, weight] of Object.entries(value)) {
				if (!oneOf(PRIORITIES, key)) drop('priorities', 'unknown_field');
				else if (oneOf(LEVELS, weight)) next[key] = LEVEL_WEIGHT[weight];
				else if (source === 'model') drop('priorities', 'model_number');
				else if (typeof weight === 'number' && Number.isFinite(weight))
					next[key] = Math.min(1, Math.max(0, weight));
				else drop('priorities', 'unknown_value');
			}
			if (Object.keys(next).length > 0) patch.priorities = next;
		}
	}

	if (Object.hasOwn(raw, 'query')) {
		const value = raw.query;
		if (typeof value !== 'string') drop('query', 'invalid_shape');
		else {
			const query = value.normalize('NFC').trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY_LENGTH);
			if (source === 'model' && MONEYISH.test(query)) drop('query', 'search_has_number');
			else if (source === 'model' && query !== '') {
				const filters = mergeFilters(plan.filters, patch.filters);
				if (matchProducts(catalog, filters, query).length === 0) drop('query', 'search_no_match');
				else patch.query = query;
			} else patch.query = query;
		}
	}

	if (Object.hasOwn(raw, 'simplified')) {
		if (typeof raw.simplified === 'boolean') patch.simplified = raw.simplified;
		else drop('simplified', 'invalid_shape');
	}

	if (Object.hasOwn(raw, 'sections')) {
		const value = raw.sections;
		if (!Array.isArray(value)) drop('sections', 'invalid_shape');
		else {
			const sections: Section[] = [];
			for (const section of value) {
				if (!oneOf(SECTIONS, section)) drop('sections', 'unknown_value');
				else if (sections.includes(section)) drop('sections', 'duplicate');
				else if (sections.length >= MAX_SECTIONS) drop('sections', 'too_many');
				else sections.push(section);
			}
			if (sections.length === 0) drop('sections', 'empty_list');
			else patch.sections = normalizeSections(sections);
		}
	}

	return { patch, dropped };
}

/** Unique, at most seven, and the product list always present (added at the end). */
export function normalizeSections(sections: readonly Section[]): Section[] {
	const unique = sections.filter((section, index) => sections.indexOf(section) === index);
	if (!unique.includes('products')) return [...unique.slice(0, MAX_SECTIONS - 1), 'products'];
	let others = 0;
	return unique.filter((section) => section === 'products' || others++ < MAX_SECTIONS - 1);
}

function mergeFilters(current: Filters, patch: PlanPatch['filters']): Filters {
	if (!patch) return current;
	return {
		category: patch.category !== undefined ? patch.category : current.category,
		maxPrice: patch.maxPrice !== undefined ? patch.maxPrice : current.maxPrice,
		shops: patch.shops ?? current.shops,
		mallOnly: patch.mallOnly ?? current.mallOnly
	};
}

/**
 * Merge a validated patch: lists replace, priorities and filters merge, `null` clears a filter.
 * A category change drops search words (unless the patch sets new ones) and specs the new
 * category does not have.
 */
export function mergePlan(plan: Plan, patch: PlanPatch, catalog: CatalogPort): Plan {
	const filters = mergeFilters(plan.filters, patch.filters);
	const categoryChanged = filters.category !== plan.filters.category;
	let query = patch.query ?? plan.query;
	let specPrefs = patch.specPrefs ?? plan.specPrefs;
	let highlightSpecs = patch.highlightSpecs ?? plan.highlightSpecs;
	if (categoryChanged) {
		if (patch.query === undefined) query = '';
		const category = filters.category;
		const known = (key: SpecKey) => category !== null && !!specDefinition(catalog, category, key);
		specPrefs = specPrefs.filter((pref) => known(pref.key));
		highlightSpecs = highlightSpecs.filter(known);
	}
	return {
		theme: patch.theme ?? plan.theme,
		layout: patch.layout ?? plan.layout,
		density: patch.density ?? plan.density,
		language: patch.language ?? plan.language,
		cardFields: patch.cardFields ?? plan.cardFields,
		highlightSpecs,
		query,
		priorities: { ...plan.priorities, ...patch.priorities },
		specPrefs,
		filters,
		simplified: patch.simplified ?? plan.simplified,
		sections: normalizeSections(patch.sections ?? plan.sections)
	};
}

function canonical(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonical);
	if (isRecord(value))
		return Object.fromEntries(
			Object.keys(value)
				.sort()
				.map((key) => [key, canonical(value[key])])
		);
	return value;
}

export const sameValue = (a: unknown, b: unknown) =>
	JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

export function partValue(plan: Plan, part: PlanPart): unknown {
	switch (part) {
		case 'filters.category':
			return plan.filters.category;
		case 'filters.maxPrice':
			return plan.filters.maxPrice;
		case 'filters.shops':
			return plan.filters.shops;
		case 'filters.mallOnly':
			return plan.filters.mallOnly;
		default:
			return plan[part];
	}
}

export function changedParts(before: Plan, after: Plan): PlanPart[] {
	const parts: PlanPart[] = [
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
	];
	return parts.filter((part) => !sameValue(partValue(before, part), partValue(after, part)));
}

/** Parts a patch would touch, used for explicit precedence. */
export function patchParts(patch: PlanPatch): PlanPart[] {
	const parts: PlanPart[] = [];
	for (const key of Object.keys(patch) as (keyof PlanPatch)[]) {
		if (key === 'filters') {
			for (const filterKey of Object.keys(patch.filters ?? {}))
				parts.push(`filters.${filterKey}` as PlanPart);
		} else parts.push(key);
	}
	return parts;
}

/** Remove the given parts from a patch. */
export function withoutParts(patch: PlanPatch, parts: readonly PlanPart[]): PlanPatch {
	const next: Record<string, unknown> = { ...patch };
	const filters: Record<string, unknown> = { ...(patch.filters ?? {}) };
	for (const part of parts) {
		if (part.startsWith('filters.')) delete filters[part.slice('filters.'.length)];
		else delete next[part];
	}
	if (patch.filters) {
		if (Object.keys(filters).length > 0) next.filters = filters;
		else delete next.filters;
	}
	return next;
}

/** A patch that sets one part back to its standard value. */
export function standardPartPatch(part: PlanPart): PlanPatch {
	switch (part) {
		case 'filters.category':
			return { filters: { category: null } };
		case 'filters.maxPrice':
			return { filters: { maxPrice: null } };
		case 'filters.shops':
			return { filters: { shops: [] } };
		case 'filters.mallOnly':
			return { filters: { mallOnly: false } };
		case 'priorities':
			return { priorities: standardPlan.priorities };
		default:
			return { [part]: standardPlan[part] };
	}
}

/** Sections as they render: no second table when the layout already is one. */
export function pageSections(plan: Plan): Section[] {
	return plan.sections.filter((section) => !(section === 'compare' && plan.layout === 'table'));
}

export function isKnownProduct(catalog: CatalogPort, id: unknown): id is string {
	return !!findProduct(catalog, id);
}
