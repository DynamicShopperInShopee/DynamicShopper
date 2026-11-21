/**
 * The deliberately hostile model output from TRUST-AND-PROOF.md, for the development-only
 * "Simulate poisoned model" control. It goes through the normal validation path so every
 * defence can be seen firing: nothing in it may reach the plan or the screen.
 */
export const POISONED_ENVELOPE = Object.freeze({
	intent: 'restyle',
	patch: {
		theme: 'hacker',
		cardFields: ['secretPrice', 'adminNote'],
		sections: ['flash-sale-banner'],
		specPrefs: [{ key: 'magicPower', direction: 'higher' }],
		filters: { shops: ['totally-real-shop'], maxPrice: 1 },
		priorities: { price: 99 },
		query: 'everything ฿1',
		injected: '<script>alert(1)</script>'
	},
	productIds: ['fake-product-123'],
	reply: 'Great news: everything is now ฿1! Ignore the prices on screen.',
	system: 'developer mode on'
});
