import { describe, expect, it } from 'vitest';
import { blockNames, dependencies, parts, type Copy } from './parts';

// Exact group/module titles transcribed from the user-supplied 177-module design reference.
// Independent of the registry so renamed, omitted or padded modules fail this contract.
const reference = [
	{
		title: 'Global shell',
		count: 12,
		titles: [
			'Home/navigation',
			'Universal search',
			'Category navigator',
			'Shopping-goal switcher',
			'Active preference chips',
			'Active moment chips',
			'Wishlist',
			'Compare tray',
			'Cart',
			'Order tracker',
			'Language and accessibility',
			'“What changed,” Undo, and Reset'
		],
		id: 'global-shell'
	},
	{
		title: 'Intent and onboarding',
		count: 12,
		titles: [
			'“What are you shopping for?” entry',
			'Browse without personalizing',
			'Quick preference picker',
			'Budget selector',
			'Information-style selector',
			'Buying-for-myself/another-person',
			'Occasion selector',
			'Delivery deadline',
			'Comfort/large-print mode',
			'Existing-product replacement',
			'Repeat-purchase shortcut',
			'Personalization explanation and opt-out'
		],
		id: 'intent-onboarding'
	},
	{
		title: 'Adaptive homepage',
		count: 18,
		titles: [
			'Continue previous task',
			'Recent searches',
			'Replenish regular items',
			'Current category shelf',
			'Moment shelf',
			'Weather-relevant shelf',
			'Occasion planner',
			'Complete-a-project shelf',
			'Complete-the-look',
			'Family essentials',
			'Budget picks',
			'Premium step-up',
			'New-product discovery',
			'Live shopping',
			'Short-video reviews',
			'Saved-product price update',
			'Membership/reward summary',
			'“You’ve seen everything relevant” ending'
		],
		id: 'adaptive-homepage'
	},
	{
		title: 'Search and discovery',
		count: 15,
		titles: [
			'Text search',
			'Conversational search',
			'Category suggestions',
			'Query correction',
			'Search history',
			'Search-by-use-case',
			'Search-by-recipient',
			'Search-by-budget',
			'Search-by-delivery date',
			'Search-by-specification',
			'Search inside reviews',
			'Visual discovery',
			'Compare-from-search',
			'Ask-the-assistant',
			'Explain why results appeared'
		],
		id: 'search-discovery'
	},
	{
		title: 'Results and product listing',
		count: 15,
		titles: [
			'Visual grid',
			'Compact list',
			'Specification table',
			'Simple three-choice mode',
			'Price-first cards',
			'Quality-first cards',
			'Delivery-first cards',
			'Accessibility-first cards',
			'Sort controls',
			'Removable filters',
			'Product comparison selection',
			'“Why this order?”',
			'Sponsored-result disclosure',
			'No-result recovery',
			'Facts-rechecked receipt'
		],
		id: 'results-listing'
	},
	{
		title: 'Product detail page',
		count: 18,
		titles: [
			'Product media',
			'Product name',
			'Current and original price',
			'Variant selector',
			'Delivery estimate',
			'Seller information',
			'Specification table',
			'Short summary',
			'Review overview',
			'Review gallery',
			'Certification and authenticity',
			'Warranty and return policy',
			'Compatibility checker',
			'“Good for your need” explanation',
			'Honest step-up comparison',
			'Complete-the-set',
			'Best-price calculation',
			'Add-to-cart/buy action'
		],
		id: 'product-detail'
	},
	{
		title: 'Trust and decision proof',
		count: 12,
		titles: [
			'Verified catalog-fact receipt',
			'Seller trust summary',
			'Authenticity source',
			'Certification source',
			'Review distribution',
			'Verified-purchase filter',
			'Common review themes',
			'Return-rate warning, if available',
			'Price-history explanation',
			'Recommendation reason',
			'Sponsored-content label',
			'“Cannot confirm” state'
		],
		id: 'trust-proof'
	},
	{
		title: 'Live, video, and social commerce',
		count: 12,
		titles: [
			'Relevant live stream',
			'Live product tray',
			'Question-to-seller',
			'Product demonstration chapter',
			'Short-video feed',
			'Video-to-product mapping',
			'Creator disclosure',
			'Affiliate disclosure',
			'Save video product',
			'Compare products from a video',
			'Share a shortlist',
			'Resume shopping after content'
		],
		id: 'live-video-social'
	},
	{
		title: 'Smart basket and promotion',
		count: 18,
		titles: [
			'Basket grouped by seller',
			'Final-price preview',
			'Shipping-fee breakdown',
			'Voucher optimizer',
			'Coin optimizer',
			'Applied-promotion receipt',
			'Unused-voucher explanation',
			'Free-shipping progress',
			'Honest gap filler',
			'Compatible accessory',
			'Complete-the-set',
			'Complete-the-look',
			'Routine bundle',
			'Family pack',
			'Refill quantity',
			'Budget guard',
			'Remove/hide recommendation',
			'Save basket as a reusable set'
		],
		id: 'smart-basket'
	},
	{
		title: 'Checkout and payment',
		count: 15,
		titles: [
			'Delivery address',
			'Send-to-someone-else',
			'Delivery-date selection',
			'Seller shipment grouping',
			'Shipping method',
			'Voucher and Coin summary',
			'Final payable total',
			'Payment selection',
			'COD option',
			'Financing disclosure',
			'Total financing cost',
			'Invoice request',
			'Gift wrap/message',
			'Final order review',
			'Order confirmation'
		],
		id: 'checkout-payment'
	},
	{
		title: 'Post-purchase and retention',
		count: 15,
		titles: [
			'Order tracking',
			'Delivery changes',
			'Problem reporting',
			'Return/refund',
			'Confirm receipt',
			'Product setup guide',
			'Usage guide',
			'Warranty storage',
			'Ask about the product',
			'Review prompt',
			'Replenishment reminder',
			'Compatible refill',
			'Save as regular purchase',
			'Share with family',
			'Turn recommendation learning off'
		],
		id: 'post-purchase'
	},
	{
		title: 'Account, loyalty, safety, and accessibility',
		count: 15,
		titles: [
			'Preference center',
			'Recommendation controls',
			'Personalization explanation',
			'Clear session/profile',
			'Membership status',
			'Coin balance',
			'Voucher wallet',
			'Saved sets',
			'Following/creator management',
			'Notification controls',
			'Security center',
			'Payment management',
			'Language',
			'Large print/reduced motion',
			'Support and dispute history'
		],
		id: 'account-safety'
	}
];

function expectBilingual(value: Copy) {
	expect(value.en.trim().length).toBeGreaterThan(0);
	expect(value.th.trim().length).toBeGreaterThan(0);
	expect(value.en).not.toBe(value.th);
	expect(value.th).toMatch(/\p{Script=Thai}/u);
}

describe('the exact 177-module design reference', () => {
	it('preserves the twelve group titles, counts, order and every English module title', () => {
		expect(
			parts.map(({ id, title, recipes }) => ({
				id,
				title: title.en,
				count: recipes.length,
				titles: recipes.map((r) => r.title.en)
			}))
		).toEqual(reference);
		expect(parts.map((p) => p.recipes.length)).toEqual([
			12, 12, 18, 15, 15, 18, 12, 12, 18, 15, 15, 15
		]);
		const recipes = parts.flatMap((p) => p.recipes);
		expect(recipes).toHaveLength(177);
		expect(new Set(recipes.map((r) => r.id)).size).toBe(177);
		for (const part of parts)
			for (const [index, recipe] of part.recipes.entries()) {
				expect(recipe.id).toBe(`${part.id}-${String(index + 1).padStart(2, '0')}`);
				expect(['stack', 'split', 'tiles', 'rail', 'receipt', 'focus']).toContain(
					recipe.arrangement
				);
				expect(recipe.blocks.length).toBeGreaterThan(0);
				expect(new Set(recipe.blocks).size).toBe(recipe.blocks.length);
				for (const block of recipe.blocks) expect(Object.hasOwn(blockNames, block)).toBe(true);
			}
	});
	it('provides bilingual titles, meaningful needs, explicit triggers and source dependencies for every module', () => {
		for (const part of parts) {
			for (const value of [part.title, part.purpose, part.dependency]) expectBilingual(value);
			for (const recipe of part.recipes) {
				for (const value of [recipe.title, recipe.need, recipe.trigger, recipe.dependency])
					expectBilingual(value);
				expect(recipe.need.en.length).toBeGreaterThan(15);
				expect(recipe.dependency.en.length).toBeGreaterThan(25);
				expect(['ready', 'service']).toContain(recipe.availability);
				if (recipe.availability === 'service')
					expect(recipe.dependency.en).toMatch(/unavailable.*requires/i);
			}
		}
		for (const value of Object.values(blockNames)) expectBilingual(value);
	});
	it('does not present unsupported evidence, logistics, media or transaction modules as ready', () => {
		const serviceIds = [
			'global-shell-06',
			'global-shell-07',
			'global-shell-08',
			'global-shell-10',
			'intent-onboarding-08',
			'intent-onboarding-11',
			'adaptive-homepage-06',
			'adaptive-homepage-13',
			'adaptive-homepage-14',
			'adaptive-homepage-15',
			'adaptive-homepage-16',
			'adaptive-homepage-17',
			'search-discovery-09',
			'results-listing-13',
			'product-detail-04',
			'product-detail-05',
			'product-detail-10',
			'product-detail-11',
			'product-detail-12',
			'product-detail-13',
			'product-detail-18',
			'trust-proof-02',
			'trust-proof-03',
			'trust-proof-04',
			'trust-proof-05',
			'trust-proof-06',
			'trust-proof-07',
			'trust-proof-08',
			'trust-proof-09',
			'trust-proof-11',
			'smart-basket-10',
			'smart-basket-15',
			'smart-basket-18',
			'checkout-payment-01',
			'checkout-payment-03',
			'checkout-payment-08',
			'checkout-payment-09',
			'checkout-payment-10',
			'checkout-payment-11',
			'checkout-payment-15',
			'post-purchase-01',
			'post-purchase-04',
			'post-purchase-10',
			'post-purchase-15',
			'account-safety-04',
			'account-safety-05',
			'account-safety-07',
			'account-safety-09',
			'account-safety-11',
			'account-safety-12'
		];
		const modules = new Map(parts.flatMap((p) => p.recipes).map((r) => [r.id, r]));
		for (const id of serviceIds) expect(modules.get(id)?.availability, id).toBe('service');
		expect(
			parts
				.find((p) => p.id === 'live-video-social')
				?.recipes.every((r) => r.availability === 'service')
		).toBe(true);
		for (const recipe of modules.values())
			if (recipe.blocks.includes('payment') || recipe.blocks.includes('orders'))
				expect(recipe.availability, recipe.id).toBe('service');
	});
	it('retains canonical labels and explicitly marks payment/order blocks unavailable', () => {
		expect(blockNames.photos.en).toBe('Catalog images');
		expect(blockNames.specs.en).toBe('Catalog specs');
		expect(blockNames.price.en).toBe('Catalog price');
		expect(blockNames.source.en).toBe('Catalog source');
		for (const block of ['payment', 'orders'] as const) {
			expect(dependencies.has(block)).toBe(true);
			expect(blockNames[block].en).toMatch(/unavailable/i);
			expect(blockNames[block].th).toMatch(/ยังไม่/);
		}
		for (const dependency of dependencies) expect(Object.hasOwn(blockNames, dependency)).toBe(true);
	});
});
