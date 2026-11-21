import { describe, expect, it } from 'vitest';
import { optimizeDeal, DEFAULT_COIN_BALANCE } from './index.ts';
import { optimizeBasket } from './optimizer.ts';
import { products, type Voucher } from '../catalog/index.ts';

const openedAt = Date.parse('2026-11-21T03:30:00Z');
const context = { openedAt, now: openedAt };
const day = 24 * 60 * 60 * 1000;

function item(id: string, price = 1_000, shopId = 'shop', shipping = 0) {
	return { id, price, shopId, shipping };
}

function fixed(code: string, kind: Voucher['kind'], amount: number, minSpend = 0): Voucher {
	return {
		code,
		kind,
		shopId: kind === 'shop' ? 'shop' : undefined,
		minSpend,
		discount: { kind: 'fixed', amount },
		expiresAfterMs: 2 * day
	};
}

describe('voucher optimizer', () => {
	it('prices the canonical rice cooker with the shared balance and reconciles every saving', () => {
		expect(DEFAULT_COIN_BALANCE).toBe(1200);
		const receipt = optimizeDeal([{ productId: 'cooker-one-button', quantity: 1 }], context);
		expect(receipt).toMatchObject({
			subtotal: 690,
			shipping: 50,
			baseline: 740,
			appliedVouchers: [
				{ code: 'SAVE50', amount: 50 },
				{ code: 'SHIP40', amount: 40 }
			],
			coinsUsed: 65,
			total: 585,
			savings: 155
		});
		expect(receipt?.unusedVouchers.map(({ code, reason, gap }) => [code, reason, gap])).toEqual([
			['MEGA8', 'minimum-spend', 310],
			['KRUA150', 'minimum-spend', 510],
			['SHIP60', 'minimum-spend', 810],
			['FLASH100', 'expired', undefined],
			['AUDIO200', 'no-eligible-item', undefined],
			['GAMER10', 'no-eligible-item', undefined],
			['GLOW15', 'no-eligible-item', undefined],
			['TECH100', 'no-eligible-item', undefined]
		]);
	});

	it('skips a shop voucher to meet an exact platform minimum', () => {
		const items = [item('product')];
		const offers = [fixed('SHOP', 'shop', 100, 1000), fixed('PLATFORM', 'platform', 200, 1000)];
		const receipt = optimizeBasket([{ productId: 'product', quantity: 1 }], context, items, offers);
		expect(receipt).toMatchObject({
			appliedVouchers: [{ code: 'PLATFORM', amount: 200 }],
			total: 720,
			coinsUsed: 80
		});
	});

	it('uses post-shop spend for both order-wide minima and selects at most one per slot', () => {
		const offers = [
			fixed('SHOP-A', 'shop', 100),
			fixed('SHOP-B', 'shop', 110),
			fixed('PLATFORM', 'platform', 1, 950),
			fixed('SHIPPING', 'shipping', 1, 950),
			fixed('ACTUAL', 'shipping', 10, 890)
		];
		const receipt = optimizeBasket(
			[{ productId: 'product', quantity: 1 }],
			{ ...context, coinBalance: 0 },
			[item('product', 1000, 'shop', 30)],
			offers
		);
		expect(receipt?.appliedVouchers.map(({ code }) => code)).toEqual(['SHOP-B', 'ACTUAL']);
		expect(receipt?.unusedVouchers).toMatchObject([
			{ code: 'PLATFORM', reason: 'minimum-spend', gap: 60 },
			{ code: 'SHIPPING', reason: 'minimum-spend', gap: 60 },
			{ code: 'SHOP-A', reason: 'beaten' }
		]);
	});

	it('combines repeated quantities and charges each shop its highest shipping fee once', () => {
		const basket = ['a', 'a', 'b', 'c'].map((productId) => ({ productId, quantity: 1 }));
		const items = [item('a', 31, 'shop', 4), item('b', 22, 'shop', 9), item('c', 12, 'other', 3)];
		const receipt = optimizeBasket(basket, { ...context, coinBalance: 0 }, items, []);
		expect(receipt).toMatchObject({
			items: [
				{ productId: 'a', quantity: 2 },
				{ productId: 'b', quantity: 1 },
				{ productId: 'c', quantity: 1 }
			],
			shops: [
				{ shopId: 'other', shipping: 3 },
				{ shopId: 'shop', shipping: 9 }
			],
			subtotal: 96,
			shipping: 12,
			total: 108,
			savings: 0
		});
		expect(
			optimizeBasket([...basket].reverse(), { ...context, coinBalance: 0 }, items, [])
		).toEqual(receipt);
	});

	it('floors percentage discounts and caps fixed discounts at the amount they apply to', () => {
		const percent: Voucher = {
			...fixed('PERCENT', 'platform', 0),
			discount: { kind: 'percent', percent: 15, cap: 99 }
		};
		const receipt = optimizeBasket(
			[{ productId: 'p', quantity: 1 }],
			{ ...context, coinBalance: 2 },
			[item('p', 79, 'shop', 3)],
			[percent, fixed('SHIP', 'shipping', 40)]
		);
		expect(receipt).toMatchObject({
			appliedVouchers: [{ amount: 11 }, { amount: 3 }],
			coinsUsed: 2,
			total: 66,
			savings: 16
		});
		expect(
			optimizeBasket([{ productId: 'p', quantity: 1 }], context, [item('p', 1000)], [percent])
				?.appliedVouchers
		).toMatchObject([{ amount: 99 }]);
	});

	it('uses the fewest vouchers on ties and breaks equal stacks by stable code', () => {
		const offers = [
			fixed('Z-PLATFORM', 'platform', 50),
			fixed('A-PLATFORM', 'platform', 50),
			fixed('SHIP', 'shipping', 25)
		];
		const basket = [{ productId: 'p', quantity: 1 }];
		const items = [item('p', 100)];
		const receipt = optimizeBasket(basket, context, items, offers);
		expect(receipt?.appliedVouchers).toMatchObject([{ code: 'A-PLATFORM' }]);
		expect(optimizeBasket(basket, context, items, [...offers].reverse())).toEqual(receipt);
		expect(
			optimizeBasket(basket, context, [item('p', 10)], [fixed('TIE', 'platform', 1)])
				?.appliedVouchers
		).toEqual([]);
	});

	it('marks vouchers soon at exactly 24 hours and excludes them at the expiry instant', () => {
		const basket = [{ productId: 'p', quantity: 1 }];
		const items = [item('p')];
		const offers = [fixed('PLATFORM', 'platform', 100)];
		expect(
			optimizeBasket(basket, { ...context, now: openedAt + day - 1 }, items, offers)
				?.appliedVouchers
		).toMatchObject([{ expiresSoon: false }]);
		expect(
			optimizeBasket(basket, { ...context, now: openedAt + day }, items, offers)?.appliedVouchers
		).toMatchObject([{ expiresSoon: true }]);
		expect(
			optimizeBasket(basket, { ...context, now: openedAt + 2 * day }, items, offers)?.unusedVouchers
		).toMatchObject([{ reason: 'expired', expiresSoon: false }]);
	});

	it('rejects empty, unknown, malformed, fractional and unsafe baskets', () => {
		expect(optimizeDeal([], context)).toBeNull();
		expect(optimizeDeal([{ productId: 'constructor', quantity: 1 }], context)).toBeNull();
		for (const quantity of [0, -1, 1.2, Infinity, Number.MAX_SAFE_INTEGER]) {
			expect(optimizeDeal([{ productId: 'cooker-one-button', quantity }], context)).toBeNull();
		}
		const basket = [{ productId: 'p', quantity: 1 }];
		expect(
			optimizeBasket(basket, context, [item('p', Number.MAX_SAFE_INTEGER, 'shop', 1)], [])
		).toBeNull();
		expect(optimizeBasket(basket, { ...context, coinBalance: -1 }, [item('p')], [])).toBeNull();
	});

	it('prices a basket spanning the whole catalog and caps coins to the shared balance', () => {
		const basket = products.map(({ id }) => ({ productId: id, quantity: 2 }));
		const receipt = optimizeDeal(basket, context);
		expect(receipt?.shops).toHaveLength(5);
		expect(receipt?.items).toHaveLength(33);
		expect(receipt?.coinsUsed).toBe(DEFAULT_COIN_BALANCE);
		const voucherSavings = receipt?.appliedVouchers.reduce((sum, { amount }) => sum + amount, 0);
		expect(receipt?.savings).toBe((voucherSavings ?? 0) + DEFAULT_COIN_BALANCE);
		expect(receipt?.total).toBe((receipt?.baseline ?? 0) - (receipt?.savings ?? 0));
	});

	it('declines to price a clock reading from before store opening', () => {
		const basket = [{ productId: 'cooker-one-button', quantity: 1 }];
		expect(optimizeDeal(basket, { openedAt, now: openedAt - 1 })).toBeNull();
	});

	it('deduplicates equivalent order-wide discounts without losing their unused reasons', () => {
		const offers = Array.from({ length: 320 }, (_, index) => `${index}`.padStart(3, '0')).flatMap(
			(code) => [fixed(`P${code}`, 'platform', 50), fixed(`S${code}`, 'shipping', 10)]
		);
		const receipt = optimizeBasket(
			[{ productId: 'p', quantity: 1 }],
			{ ...context, coinBalance: 0 },
			[item('p', 1000, 'shop', 30)],
			offers
		);
		expect(receipt?.appliedVouchers.map(({ code }) => code)).toEqual(['P000', 'S000']);
		expect(receipt?.total).toBe(970);
		expect(receipt?.unusedVouchers).toHaveLength(638);
	});

	it('bounds pathological slot combinations without reporting an approximate receipt', () => {
		const items = Array.from({ length: 18 }, (_, i) => item(String(i), 50, String(i)));
		const offers = items.map(({ shopId }) => ({ ...fixed(shopId, 'shop', 1), shopId }));
		const basket = items.map(({ id }) => ({ productId: id, quantity: 1 }));
		expect(optimizeBasket(basket, context, items, offers)).toBeNull();
	});
});
