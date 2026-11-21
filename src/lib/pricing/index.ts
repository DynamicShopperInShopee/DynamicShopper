import { products, vouchers } from '../catalog/index.ts';
import { optimizeAddOns } from './addons.ts';
import { optimizeBasket } from './optimizer.ts';
import type { BasketItem, PricingContext } from './optimizer.ts';

export { DEFAULT_COIN_BALANCE } from './optimizer.ts';
export type {
	AppliedVoucher,
	BasketItem,
	DealReceipt,
	PricedItem,
	PricingContext,
	ShopReceipt,
	UnusedVoucher
} from './optimizer.ts';
export type { AddOn } from './addons.ts';

export function optimizeDeal(basket: readonly BasketItem[], context: PricingContext) {
	return optimizeBasket(basket, context, products, vouchers);
}

export function findAddOns(basket: readonly BasketItem[], context: PricingContext) {
	return optimizeAddOns(basket, context, products, vouchers);
}
