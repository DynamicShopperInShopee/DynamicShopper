import { expect, test } from '@playwright/test';
import { defaultPlan } from '../personalization/plan';

for (const layout of ['grid', 'list'] as const) {
	test(`${layout} cards follow chosen detail order and keep preferred specs first`, async ({
		page
	}) => {
		await page.addInitScript(
			(plan) => localStorage.setItem('dynamicshopper.store.v1', JSON.stringify({ plan })),
			{
				...defaultPlan,
				query: 'rice cooker',
				category: 'rice-cooker',
				layout,
				details: ['reviews', 'specs', 'shipping', 'summary', 'price', 'rating'],
				highlightedSpecs: ['warranty'],
				specPreferences: { capacity: 'higher' }
			}
		);
		await page.goto('/?view=receipt');
		const card = page.locator('[data-product-card="cooker-one-button"]');
		await expect(card.locator('[data-fact="review.1"]')).toBeVisible();
		const fields = await card
			.locator('[data-fact-node]')
			.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-fact')));
		expect(fields.slice(0, 5)).toEqual([
			'name',
			'review.0',
			'review.1',
			'spec.warranty',
			'spec.capacity'
		]);
		expect(fields.indexOf('shipping')).toBeLessThan(fields.indexOf('summary'));
		expect(fields.indexOf('summary')).toBeLessThan(fields.indexOf('price'));
		expect(fields.indexOf('price')).toBeLessThan(fields.indexOf('rating'));
		await expect(card.locator('[data-fact="reviewCount"]')).toBeVisible();
		await expect(card.locator('[data-fact="shop"]')).toHaveCount(0);
		await expect(card.getByRole('button', { name: /^Add to cart / })).toBeEnabled();
		await expect(page.locator('#products [data-proof=verified]').first()).toBeVisible();
	});
}

test('an ordered subset omits price and still has a linked name and product actions', async ({
	page
}) => {
	await page.addInitScript(
		(plan) => localStorage.setItem('dynamicshopper.store.v1', JSON.stringify({ plan })),
		{
			...defaultPlan,
			query: 'rice cooker',
			details: ['summary', 'specs']
		}
	);
	await page.goto('/?view=receipt');
	const card = page.locator('[data-product-card="cooker-one-button"]');
	await expect(card.locator('[data-fact="summary"]')).toBeVisible();
	await expect(card.locator('[data-fact="price"]')).toHaveCount(0);
	await expect(card.locator('a.product-link')).toBeVisible();
	await card.getByRole('button', { name: 'Best price', exact: true }).click();
	await expect(page.locator('.quote [data-deal-fact="total"]')).toBeVisible();
});
