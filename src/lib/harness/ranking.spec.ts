import { describe, expect, it } from 'vitest';
import type { Product } from '../catalog/index.ts';
import { defaultCatalog as catalog, type CatalogPort } from './catalog-port.ts';
import { mergePlan, standardPlan } from './plan.ts';
import { explainRank, rankProducts } from './ranking.ts';

const miceUnderBudget = mergePlan(
	standardPlan,
	{
		filters: { category: 'mouse', maxPrice: 1500 },
		specPrefs: [
			{ key: 'battery', direction: 'higher' },
			{ key: 'weight', direction: 'lower' }
		]
	},
	catalog
);

describe('R4 · deterministic, explainable ranking', () => {
	it('reference case: battery and light weight under ฿1,500 leaves three mice with Aero X first', () => {
		const allMice = rankProducts(
			catalog,
			mergePlan(standardPlan, { filters: { category: 'mouse' } }, catalog)
		);
		const ranked = rankProducts(catalog, miceUnderBudget);
		expect(allMice.length).toBeGreaterThan(3); // the budget filter really removed products
		expect(ranked.map((row) => row.product.id)).toHaveLength(3);
		expect(ranked[0].product.id).toBe('aero-x');
		expect(ranked.every((row) => row.product.price <= 1500)).toBe(true);
	});

	it('the explanation terms are exactly the terms the score summed', () => {
		for (const row of rankProducts(catalog, miceUnderBudget)) {
			const sum = row.terms.reduce((total, term) => total + term.contribution, 0);
			expect(row.score).toBeCloseTo(sum, 12);
		}
		const bars = explainRank(rankProducts(catalog, miceUnderBudget)[0]);
		expect(bars.length).toBeLessThanOrEqual(3);
		expect(bars[0].width).toBe(4);
		expect(JSON.stringify(bars.map((bar) => bar.label))).not.toMatch(/\p{Nd}/u);
	});

	it('gives the same order for any input order (permutation invariance)', () => {
		const reference = rankProducts(catalog, standardPlan).map((row) => row.product.id);
		let seed = 3;
		for (let i = 0; i < 20; i++) {
			const shuffled = [...catalog.products].sort(
				() => ((seed = (seed * 16807) % 2147483647) % 3) - 1
			);
			const port: CatalogPort = { ...catalog, products: shuffled };
			expect(rankProducts(port, standardPlan).map((row) => row.product.id)).toEqual(reference);
		}
	});

	it('breaks ties by shop rating, then name, then id', () => {
		const base = catalog.products.find((p) => p.id === 'nova-lite') as Product;
		const twin = (id: string, shopId: Product['shopId'], en: string): Product => ({
			...base,
			id,
			shopId,
			name: { en, th: en }
		});
		const port: CatalogPort = {
			...catalog,
			products: [
				twin('b', 'gamerzone', 'Same'),
				twin('a', 'gamerzone', 'Same'),
				twin('c', 'techhub', 'Zed'),
				twin('d', 'gamerzone', 'Alpha')
			]
		};
		expect(rankProducts(port, standardPlan).map((row) => row.product.id)).toEqual([
			'c',
			'd',
			'a',
			'b'
		]);
	});

	it('handles empty, single, constant-range and missing-spec sets without dividing by zero', () => {
		expect(rankProducts(catalog, mergePlan(standardPlan, { query: 'unicorn' }, catalog))).toEqual(
			[]
		);
		const single = rankProducts(catalog, mergePlan(standardPlan, { query: 'titan' }, catalog));
		expect(single).toHaveLength(1);
		expect(Number.isFinite(single[0].score)).toBe(true);
		const base = catalog.products.find((p) => p.id === 'nova-lite') as Product;
		const port: CatalogPort = {
			...catalog,
			products: [
				{ ...base, id: 'x', specs: { ...base.specs, battery: 50 } },
				{ ...base, id: 'y', specs: { ...base.specs, battery: 50 } },
				{ ...base, id: 'z', specs: { dpi: 1 } }
			]
		};
		const plan = mergePlan(
			standardPlan,
			{ filters: { category: 'mouse' }, specPrefs: [{ key: 'battery', direction: 'higher' }] },
			catalog
		);
		const ranked = rankProducts(port, plan);
		expect(ranked).toHaveLength(3);
		for (const row of ranked) expect(Number.isFinite(row.score)).toBe(true);
		expect(
			ranked.find((row) => row.product.id === 'z')?.terms.find((t) => t.id === 'spec:battery')
				?.contribution
		).toBe(0);
	});

	it('simplified mode keeps only the top three, after ordering', () => {
		const full = rankProducts(catalog, standardPlan).map((row) => row.product.id);
		const simple = rankProducts(catalog, { ...standardPlan, simplified: true }).map(
			(row) => row.product.id
		);
		expect(simple).toEqual(full.slice(0, 3));
	});
});
