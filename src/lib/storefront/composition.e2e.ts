import { expect, test } from '@playwright/test';
import { defaultPlan } from '../personalization/plan';

test('renders chosen card facts and directional priorities without duplicate review copy', async ({
	page
}) => {
	await page.addInitScript(
		(plan) => {
			localStorage.setItem('dynamicshopper.store.v1', JSON.stringify({ plan }));
		},
		{
			...defaultPlan,
			query: 'rice cooker',
			category: 'rice-cooker',
			details: ['price', 'specs', 'vouchers'],
			sections: ['what-matters', 'reviews', 'products'],
			priorities: { rating: 0, value: 0 },
			specPreferences: { capacity: 'higher' },
			highlightedSpecs: ['capacity']
		}
	);
	await page.goto('/?view=receipt');
	const cards = page.locator('[data-product-card]');
	await expect(cards).toHaveCount(6);
	await expect(cards.first().locator('[data-fact="spec.capacity"]')).toBeVisible();
	await expect(cards.locator('[data-field="voucher.code"]').first()).toBeVisible();
	await expect(cards.locator('[data-fact^="review."]')).toHaveCount(0);
	const matters = page.getByRole('region', { name: 'What matters', exact: true });
	await expect(matters).toContainText('Higher Capacity');
	await expect(matters).not.toContainText('Rating');
	const reason = cards.first().locator('.rank');
	await reason.locator('summary').click();
	await expect(reason.locator('[data-rank-bar]').first()).toBeVisible();
	expect(await reason.innerText()).not.toMatch(/\p{N}/u);
});

test('composes chat-selected sections in order without listing the same product twice', async ({
	page
}) => {
	await page.goto('/?view=receipt');
	await page.getByRole('searchbox').fill('rice cooker');
	await page.getByRole('button', { name: 'Search', exact: true }).click();
	await page.getByRole('textbox', { name: 'Ask the store', exact: true }).fill('visual style');
	await page.getByRole('button', { name: 'Send', exact: true }).click();
	const products = page.locator('#products');
	await expect(products.getByRole('heading', { name: 'Top picks', exact: true })).toBeVisible();
	await expect(
		products.getByRole('heading', { name: 'What buyers say', exact: true })
	).toBeVisible();
	await expect(products.locator('[data-product-card]')).toHaveCount(6);
	expect(
		await products
			.locator('[data-product-card]')
			.evaluateAll((nodes) => new Set(nodes.map((n) => n.getAttribute('data-product-card'))).size)
	).toBe(6);
	await page.getByRole('textbox', { name: 'Ask the store', exact: true }).fill('mom mode');
	await page.getByRole('button', { name: 'Send', exact: true }).click();
	const headings = await products.getByRole('heading', { level: 2 }).allTextContents();
	expect(headings).toEqual(['สินค้า', 'สินค้าที่แนะนำ', 'สิ่งที่ควรดู', 'ดีลที่ดีที่สุด', 'แชร์กับครอบครัว']);
	await expect(products.locator('[data-product-card]')).toHaveCount(3);
	await expect(products.locator('[data-deal-fact="extraCost"]')).toHaveCount(0);
});
