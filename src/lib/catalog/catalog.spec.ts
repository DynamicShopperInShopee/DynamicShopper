import { expect, it } from 'vitest';
import { categories, getProduct, products, resolveFact, shops, specs, vouchers } from './index';

it('provides the full simulated catalog with valid cross-references and listing facts', () => {
	expect(products).toHaveLength(33);
	expect(shops).toHaveLength(5);
	expect(Object.keys(categories)).toHaveLength(5);
	expect(new Set(products.map(({ id }) => id)).size).toBe(products.length);
	for (const product of products) {
		expect(shops.find(({ id }) => id === product.shopId)?.categories).toContain(product.category);
		expect(Object.keys(product.specs).sort()).toEqual(
			specs[product.category].map(({ key }) => key).sort()
		);
		for (const definition of specs[product.category]) {
			const value = product.specs[definition.key];
			expect(resolveFact(product.id, `spec.${definition.key}`)?.unit).toBe(definition.unit);
			if (definition.direction) {
				expect(Number.isFinite(value)).toBe(true);
			} else {
				expect(typeof value === 'object' && value.en.trim().length > 0).toBe(true);
				expect(typeof value === 'object' && value.th.trim().length > 0).toBe(true);
			}
		}
		for (const copy of [product.name, product.summary, ...product.reviews]) {
			expect(copy.en.trim()).not.toBe('');
			expect(copy.th.trim()).not.toBe('');
		}
		expect(product.reviews).toHaveLength(2);
		for (const amount of [product.price, product.shipping, product.sold, product.reviewCount]) {
			expect(Number.isInteger(amount)).toBe(true);
			expect(amount).toBeGreaterThanOrEqual(0);
		}
		expect(product.price).toBeGreaterThan(0);
		if (product.originalPrice !== undefined) {
			expect(Number.isInteger(product.originalPrice)).toBe(true);
			expect(product.originalPrice).toBeGreaterThan(product.price);
		}
		expect(product.rating).toBeGreaterThanOrEqual(0);
		expect(product.rating).toBeLessThanOrEqual(5);
		expect(Object.keys(product.scores).sort()).toEqual([
			'design',
			'durability',
			'performance',
			'value'
		]);
		for (const score of Object.values(product.scores)) {
			expect(score).toBeGreaterThanOrEqual(0);
			expect(score).toBeLessThanOrEqual(1);
		}
	}
});

it('preserves the documented citable and non-citable listing stories', () => {
	expect(
		products
			.filter(({ category, price }) => category === 'mouse' && price < 1500)
			.map(({ id }) => id)
			.sort()
	).toEqual(['aero-x', 'nova-lite', 'vortex-w']);
	expect(resolveFact('vortex-w', 'spec.battery')?.raw).toBe(120);
	expect(getProduct('vortex-w')?.reviews[0].en).toBe('One charge a month is enough');
	expect(getProduct('cooker-one-button')?.reviews[0].en).toBe('Mom uses it without help');
	expect(getProduct('cooker-family')?.reviews[0].en).toBe('Large buttons suit seniors');
	expect(getProduct('sportfit')?.tags).toContain('waterproof');
	expect(resolveFact('sportfit', 'spec.waterproof')).toBeUndefined();
});

it('defines all documented vouchers by amount, threshold, scope and relative expiry', () => {
	const hour = 60 * 60 * 1000;
	const valid = 7 * 24 * hour;
	expect(vouchers).toEqual([
		{
			code: 'TECH100',
			kind: 'shop',
			shopId: 'techhub',
			minSpend: 1000,
			discount: { kind: 'fixed', amount: 100 },
			expiresAfterMs: valid
		},
		{
			code: 'GAMER10',
			kind: 'shop',
			shopId: 'gamerzone',
			minSpend: 800,
			discount: { kind: 'percent', percent: 10, cap: 150 },
			expiresAfterMs: valid
		},
		{
			code: 'AUDIO200',
			kind: 'shop',
			shopId: 'audiolab',
			minSpend: 1500,
			discount: { kind: 'fixed', amount: 200 },
			expiresAfterMs: valid
		},
		{
			code: 'KRUA150',
			kind: 'shop',
			shopId: 'homekrua',
			minSpend: 1200,
			discount: { kind: 'fixed', amount: 150 },
			expiresAfterMs: valid
		},
		{
			code: 'GLOW15',
			kind: 'shop',
			shopId: 'glow-skin',
			minSpend: 500,
			discount: { kind: 'percent', percent: 15, cap: 100 },
			expiresAfterMs: valid
		},
		{
			code: 'SAVE50',
			kind: 'platform',
			minSpend: 300,
			discount: { kind: 'fixed', amount: 50 },
			expiresAfterMs: valid
		},
		{
			code: 'MEGA8',
			kind: 'platform',
			minSpend: 1000,
			discount: { kind: 'percent', percent: 8, cap: 300 },
			expiresAfterMs: 12 * hour
		},
		{
			code: 'FLASH100',
			kind: 'platform',
			minSpend: 500,
			discount: { kind: 'fixed', amount: 100 },
			expiresAfterMs: -hour
		},
		{
			code: 'SHIP40',
			kind: 'shipping',
			minSpend: 300,
			discount: { kind: 'fixed', amount: 40 },
			expiresAfterMs: valid
		},
		{
			code: 'SHIP60',
			kind: 'shipping',
			minSpend: 1500,
			discount: { kind: 'fixed', amount: 60 },
			expiresAfterMs: valid
		}
	]);
});
