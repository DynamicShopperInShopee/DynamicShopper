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
