import { expect, it } from 'vitest';
import { findAddOns } from './index.ts';
import { optimizeAddOns } from './addons.ts';
import type { Voucher } from '../catalog/index.ts';

const context = { openedAt: 0, now: 0, coinBalance: 0 };
const item = (id: string, price: number, shopId = 'a', shipping = 0) => ({
	id,
	price,
	shopId,
	shipping
});

it('includes only candidates that cheaply unlock a previously unavailable voucher', () => {
	const products = [
		item('base', 500),
		item('cheap', 300, 'b'),
		item('same-shop', 260),
		item('shipping-eats-savings', 220, 'b', 150),
		item('over-budget', 1001, 'b'),
		item('too-small', 90, 'b')
	];
	const vouchers: Voucher[] = [
		{
			code: 'SHOP',
			kind: 'shop',
			shopId: 'b',
			minSpend: 200,
			discount: { kind: 'fixed', amount: 100 },
			expiresAfterMs: 1
		}
	];
	expect(optimizeAddOns([{ productId: 'base', quantity: 1 }], context, products, vouchers)).toEqual(
		[{ productId: 'cheap', extraCost: 200, voucherCode: 'SHOP' }]
	);
});

it('orders equal extra costs by product ID and returns at most three', () => {
	const products = [item('base', 200), ...['d', 'c', 'b', 'a'].map((id) => item(id, 100))];
	const vouchers: Voucher[] = [
		{
			code: 'ORDER',
			kind: 'platform',
			minSpend: 300,
			discount: { kind: 'fixed', amount: 50 },
			expiresAfterMs: 1
		}
	];
	const basket = [{ productId: 'base', quantity: 1 }];
	expect(optimizeAddOns(basket, context, products, vouchers)).toEqual(
		['a', 'b', 'c'].map((productId) => ({ productId, extraCost: 50, voucherCode: 'ORDER' }))
	);
});

it('uses the real catalog and optimizer to price rice cooker add-ons', () => {
	expect(
		findAddOns([{ productId: 'cooker-one-button', quantity: 1 }], { openedAt: 0, now: 0 })
	).toEqual(expect.arrayContaining([expect.objectContaining({ voucherCode: 'MEGA8' })]));
});
