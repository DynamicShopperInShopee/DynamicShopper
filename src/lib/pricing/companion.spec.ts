import { it, expect } from 'vitest';
import { companion } from './companion';
import { optimizeDeal } from './index';
it('offers one evidence-backed companion and quotes the exact full basket difference', () => {
	const basket = [{ productId: 'vitamin-c-serum', quantity: 2 }];
	const context = { openedAt: 0, now: 0, coinBalance: 300 };
	const offer = companion(basket, context)!;
	const after = optimizeDeal([...basket, { productId: offer.productId, quantity: 1 }], context)!;
	expect(offer.total).toBe(after.total);
	expect(offer.extraCost).toBe(after.total - optimizeDeal(basket, context)!.total);
	expect(basket).toEqual([{ productId: 'vitamin-c-serum', quantity: 2 }]);
});
it('hides unverified pairs, already-owned companions, and unavailable pricing', () => {
	expect(
		companion([{ productId: 'cooker-one-button', quantity: 1 }], { openedAt: 0, now: 0 })
	).toBeUndefined();
	expect(companion([{ productId: 'vitamin-c-serum', quantity: 1 }], undefined)).toBeUndefined();
	expect(
		companion(
			[
				{ productId: 'vitamin-c-serum', quantity: 1 },
				{ productId: 'ceramide-moisturiser', quantity: 1 }
			],
			{ openedAt: 0, now: 0 }
		)
	).toBeUndefined();
});
