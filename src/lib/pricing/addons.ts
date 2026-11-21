import type { Voucher } from '../catalog/index.ts';
import { compareIds, optimizeBasket } from './optimizer.ts';
import type { BasketItem, PricingContext, PricingProduct } from './optimizer.ts';

export type AddOn = Readonly<{ productId: string; extraCost: number; voucherCode: string }>;

export function optimizeAddOns(
	basket: readonly BasketItem[],
	context: PricingContext,
	catalog: readonly PricingProduct[],
	vouchers: readonly Voucher[]
): readonly AddOn[] {
	const base = optimizeBasket(basket, context, catalog, vouchers);
	if (!base) return [];

	const existing = new Set(base.items.map(({ productId }) => productId));
	const unavailable = new Set(
		base.unusedVouchers
			.filter(({ reason }) => reason === 'minimum-spend' || reason === 'no-eligible-item')
			.map(({ code }) => code)
	);
	if (unavailable.size === 0) return [];

	const addOns: AddOn[] = [];
	for (const product of catalog) {
		if (product.price > 1000 || existing.has(product.id)) continue;
		const augmented = [...basket, { productId: product.id, quantity: 1 }];
		const deal = optimizeBasket(augmented, context, catalog, vouchers);
		if (!deal) continue;
		const extraCost = deal.total - base.total;
		if (extraCost < 0 || extraCost >= product.price) continue;
		const unlocked = deal.appliedVouchers.find(({ code }) => unavailable.has(code));
		if (unlocked) addOns.push({ productId: product.id, extraCost, voucherCode: unlocked.code });
	}

	return addOns
		.sort((a, b) => a.extraCost - b.extraCost || compareIds(a.productId, b.productId))
		.slice(0, 3);
}
