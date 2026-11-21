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
	const minimumSpends = new Map(vouchers.map(({ code, minSpend }) => [code, minSpend]));
	// Receipt gaps describe the winning stack. Skipping shop vouchers gives order vouchers
	// their highest possible qualifying spend, the full item subtotal.
	const unavailable = new Set(
		base.unusedVouchers
			.filter(({ code, kind, reason }) => {
				if (reason === 'no-eligible-item') return true;
				return (
					reason === 'minimum-spend' &&
					(kind === 'shop' || (minimumSpends.get(code) ?? 0) > base.subtotal)
				);
			})
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
