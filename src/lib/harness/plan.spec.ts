import { describe, expect, it } from 'vitest';
import { defaultCatalog as catalog } from './catalog-port.ts';
import { mergePlan, normalizeSections, standardPlan, validatePatch } from './plan.ts';
import { SECTIONS, type DropCode, type Plan } from './types.ts';
import { isValidPlan } from './test-helpers.ts';

const mice: Plan = mergePlan(standardPlan, { filters: { category: 'mouse' } }, catalog);
const codes = (raw: unknown, plan: Plan = mice, source: 'model' | 'local' = 'model') =>
	validatePatch(raw, plan, catalog, source).dropped.map((d) => d.code);

describe('R1 · part-by-part validation', () => {
	it('keeps a valid theme while dropping an unknown section beside it', () => {
		const { patch, dropped } = validatePatch(
			{ theme: 'minimal', sections: ['banner', 'top-picks'] },
			mice,
			catalog,
			'model'
		);
		expect(patch.theme).toBe('minimal');
		expect(patch.sections).toEqual(['top-picks', 'products']);
		expect(dropped).toEqual([{ place: 'sections', code: 'unknown_value' }]);
	});

	it('drops each invalid sibling inside a list on its own', () => {
		const { patch, dropped } = validatePatch(
			{ cardFields: ['price', 'secret', 'price', 'specs'] },
			mice,
			catalog,
			'model'
		);
		expect(patch.cardFields).toEqual(['price', 'specs']);
		expect(dropped.map((d) => d.code)).toEqual(['unknown_value', 'duplicate']);
	});

	it('ignores an empty card list because it would blank every card', () => {
		expect(
			validatePatch({ cardFields: [] }, mice, catalog, 'model').patch.cardFields
		).toBeUndefined();
		expect(codes({ cardFields: ['nope'] })).toEqual(['unknown_value', 'empty_list']);
	});

	it('accepts spec keys only from the active category and only numeric ones for ranking', () => {
		const { patch, dropped } = validatePatch(
			{
				specPrefs: [
					{ key: 'battery', direction: 'higher' },
					{ key: 'capacity', direction: 'higher' },
					{ key: 'connection', direction: 'higher' },
					{ key: 'weight', direction: 'sideways' }
				],
				highlightSpecs: ['dpi', 'spf']
			},
			mice,
			catalog,
			'model'
		);
		expect(patch.specPrefs).toEqual([{ key: 'battery', direction: 'higher' }]);
		expect(patch.highlightSpecs).toEqual(['dpi']);
		expect(dropped.map((d) => d.code).sort()).toEqual(
			['not_in_category', 'not_numeric', 'unknown_value', 'not_in_category'].sort()
		);
	});

	it('uses the category the same patch chooses when judging specs', () => {
		const { patch } = validatePatch(
			{
				filters: { category: 'rice-cooker' },
				specPrefs: [{ key: 'capacity', direction: 'higher' }]
			},
			mice,
			catalog,
			'model'
		);
		expect(patch.specPrefs).toEqual([{ key: 'capacity', direction: 'higher' }]);
	});

	it('refuses numbers from a model: priorities must be levels and budgets are never accepted', () => {
		const { patch, dropped } = validatePatch(
			{ priorities: { price: 0.9, rating: 'high', luck: 'high' }, filters: { maxPrice: 1 } },
			mice,
			catalog,
			'model'
		);
		expect(patch.priorities).toEqual({ rating: 1 });
		expect(patch.filters).toBeUndefined();
		expect(dropped.map((d) => d.code).sort()).toEqual(
			['model_number', 'model_number', 'unknown_field'].sort()
		);
	});

	it('lets local controls set numbers, clamped and floored', () => {
		const { patch } = validatePatch(
			{ priorities: { price: 7, rating: -1 }, filters: { maxPrice: 1499.9 } },
			mice,
			catalog,
			'local'
		);
		expect(patch.priorities).toEqual({ price: 1, rating: 0 });
		expect(patch.filters?.maxPrice).toBe(1499);
		expect(codes({ filters: { maxPrice: 0.5 } }, mice, 'local')).toEqual(['unknown_value']);
	});

	it('drops model search words with digits or currency and words that match nothing', () => {
		expect(codes({ query: 'under 1500' })).toEqual(['search_has_number']);
		expect(codes({ query: 'cheap ฿ stuff' })).toEqual(['search_has_number']);
		expect(codes({ query: 'บาท' })).toEqual(['search_has_number']);
		expect(codes({ query: 'unicorn' })).toEqual(['search_no_match']);
		expect(validatePatch({ query: 'lightweight' }, mice, catalog, 'model').patch.query).toBe(
			'lightweight'
		);
	});

	it('drops unknown shops and unknown keys, keeps real shops and explicit clears', () => {
		const { patch, dropped } = validatePatch(
			{ filters: { shops: ['gamerzone', 'fake'], category: null, colour: 'red' }, hack: true },
			mice,
			catalog,
			'model'
		);
		expect(patch.filters).toEqual({ shops: ['gamerzone'], category: null });
		expect(dropped.map((d) => d.code).sort()).toEqual(
			['unknown_field', 'unknown_field', 'unknown_shop'].sort()
		);
	});

	it('keeps at most seven unique sections and always the product list', () => {
		const { patch, dropped } = validatePatch(
			{ sections: [...SECTIONS.filter((s) => s !== 'products'), 'top-picks', 'products', 'share'] },
			mice,
			catalog,
			'model'
		);
		expect(patch.sections).toHaveLength(7);
		expect(patch.sections).toContain('products');
		expect(dropped.map((d) => d.code)).toEqual(['duplicate', 'duplicate']);
		expect(normalizeSections(['top-picks'])).toEqual(['top-picks', 'products']);
	});

	it('reports wrong shapes and a non-object proposal', () => {
		expect(codes('restyle please')).toEqual(['invalid_shape']);
		expect(codes({ cardFields: 'price', simplified: 'yes', theme: 3 }).sort()).toEqual(
			['invalid_shape', 'invalid_shape', 'unknown_value'].sort()
		);
	});

	it('reaches every validation drop code (coverage of the trigger states)', () => {
		const seen = new Set<DropCode>([
			...codes({ theme: 'x', bogus: 1 }),
			...codes({ highlightSpecs: ['spf'] }),
			...codes({ specPrefs: [{ key: 'connection', direction: 'higher' }] }),
			...codes({ filters: { shops: ['nope'], maxPrice: 5 } }),
			...codes({ cardFields: [] }),
			...codes({ query: 'x9' }),
			...codes({ query: 'unicorn' }),
			...codes({ cardFields: ['price', 'price'] }),
			...codes({
				sections: [
					'top-picks',
					'compare',
					'what-matters',
					'reviews',
					'best-deal',
					'share',
					'products',
					'compare'
				]
			}),
			...codes({ sections: [] }),
			...codes(42)
		]);
		expect([...seen].sort()).toEqual(
			[
				'duplicate',
				'empty_list',
				'invalid_shape',
				'model_number',
				'not_in_category',
				'not_numeric',
				'search_has_number',
				'search_no_match',
				'unknown_field',
				'unknown_shop',
				'unknown_value'
			].sort()
		);
		// too_many is a defensive guard: the library has exactly seven sections and duplicates are
		// dropped first, so seven distinct sections is the most a proposal can hold.
		expect(codes({ sections: [...SECTIONS] })).toEqual([]);
	});

	it('property: validating any JSON-like input always merges into a valid plan', () => {
		let seed = 7;
		const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
		const atoms = [
			null,
			true,
			3,
			-1,
			0.5,
			'',
			'minimal',
			'table',
			'th',
			'products',
			'battery',
			'mouse',
			'x',
			'฿1',
			[],
			{}
		];
		const keys = [
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
			'sections',
			'category',
			'maxPrice',
			'shops',
			'mallOnly',
			'key',
			'direction',
			'price',
			'rating',
			'junk'
		];
		const value = (depth: number): unknown => {
			const r = rand();
			if (depth > 2 || r < 0.5) return atoms[Math.floor(rand() * atoms.length)];
			if (r < 0.7) return Array.from({ length: Math.floor(rand() * 4) }, () => value(depth + 1));
			return Object.fromEntries(
				Array.from({ length: Math.floor(rand() * 5) }, () => [
					keys[Math.floor(rand() * keys.length)],
					value(depth + 1)
				])
			);
		};
		for (let i = 0; i < 3000; i++) {
			const raw = value(0);
			for (const source of ['model', 'local'] as const) {
				const merged = mergePlan(mice, validatePatch(raw, mice, catalog, source).patch, catalog);
				expect(isValidPlan(merged)).toBe(true);
			}
		}
	});
});
