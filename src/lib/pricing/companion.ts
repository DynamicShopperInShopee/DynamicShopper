import { getProduct } from '../catalog/index.ts';
import { optimizeDeal, type BasketItem, type PricingContext } from './index.ts';
// Curated catalog evidence: serum review.0 explicitly describes layering with moisturiser.
export function companion(basket: readonly BasketItem[], context: PricingContext | undefined) {
	if (
		!context ||
		!basket.some((x) => x.productId === 'vitamin-c-serum') ||
		basket.some((x) => x.productId === 'ceramide-moisturiser')
	)
		return;
	const source = getProduct('vitamin-c-serum'),
		target = getProduct('ceramide-moisturiser');
	if (!source?.tags.includes('serum') || !target?.tags.includes('moisturiser')) return;
	const before = optimizeDeal(basket, context),
		after = optimizeDeal([...basket, { productId: target.id, quantity: 1 }], context);
	if (!before || !after) return;
	return {
		productId: target.id,
		sourceId: source.id,
		extraCost: after.total - before.total,
		total: after.total
	};
}
