import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import AdaptiveCard from './AdaptiveCard.svelte';
import { getProduct, formatBaht, type Locale } from '#lib/catalog/index.ts';
import { CARD_FIELDS, standardPlan, type CardField } from '#lib/harness/index.ts';
import { optimizeDeal } from '#lib/pricing/index.ts';

const product = getProduct('aero-x')!;
const clock = { openedAt: 1_000_000, now: 1_000_000 };
function card(fields: readonly CardField[], language: Locale = 'en', now = clock.now) {
	return render(AdaptiveCard, {
		props: {
			product,
			plan: {
				...standardPlan,
				language,
				cardFields: fields,
				highlightSpecs: ['battery', 'weight']
			},
			clock: { ...clock, now },
			onDeal: () => undefined
		}
	}).body;
}
const fieldsIn = (html: string) =>
	[...html.matchAll(/data-card-field="([^"]+)"/g)].map((match) => match[1]);

describe('adaptive product card', () => {
	it('renders every selected field in exact order, including a moved image', () => {
		const fields = [...CARD_FIELDS].reverse();
		expect(fieldsIn(card(fields))).toEqual(fields);
	});
	it('omits unselected content while retaining the product name and deal action', () => {
		const html = card(['summary']);
		expect(fieldsIn(html)).toEqual(['summary']);
		expect(html).toContain('data-fact="name"');
		expect(html).toContain('Best price');
		expect(html).not.toContain('data-fact="price"');
		expect(html).not.toContain('demo-photo');
		expect(html).not.toContain('data-fact="shipping"');
	});
	it.each(['en', 'th'] as const)(
		'prints canonical facts and highlighted specs first in %s',
		(language) => {
			const html = card(['specs', 'price', 'rating', 'reviews'], language);
			const specFields = [...html.matchAll(/data-fact="spec\.([^"]+)"/g)].map((match) => match[1]);
			expect(specFields.slice(0, 2)).toEqual(['battery', 'weight']);
			expect(new Set(specFields).size).toBe(specFields.length);
			expect(html).toContain(`data-fact="price" data-raw="${product.price}"`);
			expect(html).toContain(formatBaht(product.price, language));
			expect(html).toContain('data-fact="review.0"');
			expect(html).toContain('data-fact="review.1"');
			expect(html).toContain(language === 'th' ? 'ราคาดีที่สุด' : 'Best price');
		}
	);
	it('prints only optimizer-selected voucher amounts and recomputes at expiry', () => {
		const receipt = optimizeDeal([{ productId: product.id, quantity: 1 }], clock)!;
		const html = card(['vouchers']);
		expect(receipt.appliedVouchers.length).toBeGreaterThan(0);
		for (const voucher of receipt.appliedVouchers) {
			expect(html).toContain(`data-voucher="${voucher.code}" data-raw="${voucher.amount}"`);
			expect(html).toContain(formatBaht(voucher.amount, 'en'));
		}
		const expired = card(['vouchers'], 'en', clock.now + 8 * 24 * 60 * 60 * 1000);
		expect(expired).not.toContain('data-deal-fact="voucherAmount"');
		expect(expired).toContain('No voucher applies to this combination.');
	});
	it('waits for the shared clock before showing voucher calculations', () => {
		const html = render(AdaptiveCard, {
			props: {
				product,
				plan: { ...standardPlan, cardFields: ['vouchers'] },
				onDeal: () => undefined
			}
		}).body;
		expect(fieldsIn(html)).toEqual([]);
		expect(html).toContain('Best price');
	});
});
