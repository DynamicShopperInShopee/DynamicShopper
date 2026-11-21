import { describe, expect, it } from 'vitest';
import { products } from '../catalog';
import { reconcilePlanPatch } from './locked-plan';
import { interpretOffline } from './offline';
import { defaultPlan, type ShopperPlan } from './plan';
import { rankProducts } from './ranking';

describe('reconcilePlanPatch', () => {
	it('keeps the Thai rice-cooker shortlist reachable after an explicit gaming-mouse search', () => {
		const current: ShopperPlan = { ...defaultPlan, category: 'mouse', query: 'gaming mouse' };
		const turn = interpretOffline('ซื้อของขวัญให้แม่ หม้อหุงข้าว ใช้ง่ายๆ', current);
		const patch = reconcilePlanPatch(current, turn.patch, ['query'], turn.patch.category);
		const next = { ...current, ...patch };
		expect(next).toMatchObject({
			category: 'rice-cooker',
			query: '',
			locale: 'th',
			simplified: true
		});
		const shortlist = rankProducts(products, next);
		expect(shortlist).toHaveLength(3);
		expect(shortlist.every(({ product }) => product.category === 'rice-cooker')).toBe(true);
	});

	it('clears an incompatible locked search without installing an inferred search', () => {
		const current = { ...defaultPlan, query: 'gaming mouse' };
		expect(
			reconcilePlanPatch(
				current,
				{ category: 'rice-cooker', query: 'rice cooker' },
				['query'],
				'rice-cooker'
			)
		).toEqual({ category: 'rice-cooker', query: '' });
	});

	it('preserves the searched products when a proposal alone changes the category', () => {
		const current = { ...defaultPlan, query: 'gaming mouse' };
		const proposed = { category: 'rice-cooker', query: '', theme: 'minimal' } as const;
		expect(reconcilePlanPatch(current, proposed, ['query'])).toEqual({ theme: 'minimal' });
	});

	it('preserves a locked search that matches the newly selected category', () => {
		const current = { ...defaultPlan, query: 'gaming mouse' };
		const patch = reconcilePlanPatch(current, { category: 'mouse', query: '' }, ['query']);
		expect(patch).toEqual({ category: 'mouse' });
	});

	it('clears only incompatible search terms when the shopper edits the category directly', () => {
		const current = { ...defaultPlan, query: 'gaming mouse' };
		expect(reconcilePlanPatch(current, { category: 'rice-cooker' }, [], 'rice-cooker')).toEqual({
			category: 'rice-cooker',
			query: ''
		});
		expect(reconcilePlanPatch(current, { category: 'mouse' }, [], 'mouse')).toEqual({
			category: 'mouse'
		});
		const replacement = { category: 'rice-cooker', query: 'rice cooker' } as const;
		expect(reconcilePlanPatch(current, replacement, [], 'rice-cooker')).toEqual(replacement);
	});

	it('removes only out-of-category spec terms when a category change succeeds', () => {
		const current: ShopperPlan = {
			...defaultPlan,
			category: 'mouse',
			highlightedSpecs: ['weight'],
			specPreferences: { weight: 'lower' }
		};
		expect(
			reconcilePlanPatch(
				current,
				{ category: 'rice-cooker', theme: 'minimal' },
				['highlightedSpecs', 'specPreferences'],
				'rice-cooker'
			)
		).toEqual({
			category: 'rice-cooker',
			theme: 'minimal',
			highlightedSpecs: [],
			specPreferences: {}
		});
	});

	it('drops incompatible spec terms when an explicit category blocks the requested category', () => {
		const current: ShopperPlan = {
			...defaultPlan,
			category: 'mouse',
			highlightedSpecs: ['weight'],
			specPreferences: { weight: 'lower' }
		};
		const turn = interpretOffline(
			'Show rice cookers with more capacity in a compact view',
			current
		);
		expect(reconcilePlanPatch(current, turn.patch, ['category'], turn.patch.category)).toEqual({
			density: 'compact'
		});
	});

	it('keeps battery capacity and weight preferences when a cooker request is blocked', () => {
		const current: ShopperPlan = {
			...defaultPlan,
			category: 'power-bank',
			highlightedSpecs: ['weight'],
			specPreferences: { capacity: 'lower', weight: 'lower' }
		};
		const turn = interpretOffline(
			'Show rice cookers with more capacity in a compact view',
			current
		);
		expect(reconcilePlanPatch(current, turn.patch, ['category'], turn.patch.category)).toEqual({
			density: 'compact'
		});
	});

	it('keeps existing preferences when the shopper explicitly locks All products', () => {
		const current: ShopperPlan = {
			...defaultPlan,
			highlightedSpecs: ['weight'],
			specPreferences: { weight: 'lower' }
		};
		const turn = interpretOffline(
			'Show rice cookers with more capacity in a compact view',
			current
		);
		expect(reconcilePlanPatch(current, turn.patch, ['category'], turn.patch.category)).toEqual({
			density: 'compact'
		});
	});

	it('keeps compatible spec terms independently when another spec belongs to the blocked category', () => {
		const current: ShopperPlan = {
			...defaultPlan,
			category: 'mouse',
			highlightedSpecs: ['dpi'],
			specPreferences: { dpi: 'higher' }
		};
		const turn = interpretOffline('Show me lightweight earbuds with low latency', current);
		expect(reconcilePlanPatch(current, turn.patch, ['category'], turn.patch.category)).toEqual({
			highlightedSpecs: ['weight', 'dpi'],
			specPreferences: { dpi: 'higher', weight: 'lower' }
		});
	});

	it('preserves locks if the category is locked, unchanged, or absent from the patch', () => {
		const current: ShopperPlan = { ...defaultPlan, category: 'mouse', query: 'rice cooker' };
		expect(
			reconcilePlanPatch(current, { category: 'rice-cooker', query: '', locale: 'th' }, [
				'category',
				'query',
				'locale'
			])
		).toEqual({});
		expect(reconcilePlanPatch(current, { category: 'mouse', query: '' }, ['query'])).toEqual({
			category: 'mouse'
		});
		expect(reconcilePlanPatch(current, { query: '', theme: 'minimal' }, ['query'])).toEqual({
			theme: 'minimal'
		});
		expect(reconcilePlanPatch(current, { category: null, query: '' }, ['query'])).toEqual({
			category: null
		});
	});

	it('applies an unlocked patch as supplied and omits undefined entries', () => {
		expect(
			reconcilePlanPatch(
				defaultPlan,
				{ category: 'rice-cooker', query: 'rice cooker', shops: undefined },
				[]
			)
		).toEqual({ category: 'rice-cooker', query: 'rice cooker' });
	});
});
