import type { Locale } from '../catalog';
import { findAddOns, optimizeDeal, type BasketItem } from '../pricing';
import { getStoreOpenedAt } from './clock';

export function quoteBasket(basket: readonly BasketItem[], locale: Locale, withAddOns = true) {
	const openedAt = getStoreOpenedAt();
	const context = { openedAt, now: Math.max(openedAt, Date.now()) };
	const receipt = optimizeDeal(basket, context);
	if (!receipt) return;
	return { receipt, locale, addOns: withAddOns ? findAddOns(basket, context) : [] };
}
