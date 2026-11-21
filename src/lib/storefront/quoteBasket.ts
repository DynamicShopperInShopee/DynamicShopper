import type { Locale } from '../catalog';
import { findAddOns, optimizeDeal, type BasketItem, type PricingContext } from '../pricing';

export function quoteBasket(
	basket: readonly BasketItem[],
	locale: Locale,
	context: PricingContext | undefined
) {
	if (!context) return;
	const receipt = optimizeDeal(basket, context);
	if (!receipt) return;
	return { receipt, locale, addOns: findAddOns(basket, context), quotedAt: context.now };
}
