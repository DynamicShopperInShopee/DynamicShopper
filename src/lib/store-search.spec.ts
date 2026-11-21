import { describe, expect, it } from 'vitest';
import { catalog, searchProducts } from './store-search';

describe('store search', () => {
	it('finds the canonical Thai shop name', () => {
		const results = searchProducts({ query: 'ร้านทางการ TechHub' });
		expect(results.length).toBeGreaterThan(0);
		expect(results.every(({ shop }) => shop === 'TechHub Official Store')).toBe(true);
	});

	it('finds the same catalog products in Thai and English', () => {
		expect(searchProducts({ query: 'เมาส์เกมมิ่ง' })).toEqual(
			searchProducts({ query: 'gaming mouse' })
		);
		expect(searchProducts({ query: 'gaming mouse' })).toHaveLength(8);
	});

	it.each(['timer', 'ตั้งเวลา'])('finds the digital rice cooker for %s', (query) => {
		expect(searchProducts({ query }).map(({ catalogId }) => catalogId)).toContain('cooker-digital');
	});

	it('combines category, whole-baht budget and shipping filters', () => {
		const products = searchProducts({
			category: 'mouse',
			maxPrice: 1500,
			freeShipping: true
		});
		expect(products.map(({ id, price }) => ({ id, price }))).toEqual([
			{ id: 'mouse-2', price: 1190 }
		]);
	});

	it('sorts catalog prices without altering the stored order or facts', () => {
		const original = catalog.map(({ id }) => id);
		const sorted = searchProducts({ category: 'earbuds', sort: 'price-low' });
		expect(sorted.map(({ price }) => price)).toEqual([590, 790, 990, 1290, 1590, 2490, 3490]);
		expect(catalog.map(({ id }) => id)).toEqual(original);
	});
});
