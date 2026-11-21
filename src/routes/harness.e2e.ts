import { expect, test } from '@playwright/test';

// Exercise the real browser validator/rendering boundary without a network model or key.
test('orders every requested card field, omits others, and reverses the change', async ({
	page
}) => {
	let patch: unknown = {
		cardFields: ['summary', 'specs', 'price'],
		highlightSpecs: ['battery', 'weight']
	};
	await page.route('**/api/assistant', (route) =>
		route.fulfill({
			json: {
				envelope: { intent: 'restyle', patch, reply: 'I have adjusted the view.' }
			}
		})
	);
	await page.goto('/');
	await page.getByRole('button', { name: 'Shopping assistant', exact: true }).click();
	await page.getByRole('searchbox').fill('gaming mouse');
	await page.getByRole('searchbox').press('Enter');
	await page.getByRole('button', { name: 'X-ray', exact: true }).click();
	await page.getByRole('button', { name: 'Try live model', exact: true }).click();
	await page
		.getByRole('textbox', { name: 'Ask the store', exact: true })
		.fill('adjust the card details');
	await page.getByRole('button', { name: 'Send', exact: true }).click();
	const card = page.locator('#products .adaptive-card').first();
	const fields = () =>
		card
			.locator('[data-card-field]')
			.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-card-field')));
	await expect.poll(fields).toEqual(['summary', 'specs', 'price']);
	await expect(card.locator('[data-card-field="specs"] [data-fact]').first()).toHaveAttribute(
		'data-fact',
		'spec.battery'
	);
	await expect(card.locator('[data-card-field="image"]')).toHaveCount(0);
	await expect(page.locator('#products [data-proof]')).toHaveAttribute('data-proof', 'verified');
	const before = await card.locator('[data-fact="price"]').getAttribute('data-raw');
	patch = { cardFields: ['reviews', 'image', 'shipping', 'shop', 'rating', 'vouchers', 'price'] };
	await page.getByRole('textbox', { name: 'Ask the store', exact: true }).fill('change card order');
	await page.getByRole('button', { name: 'Send', exact: true }).click();
	await expect
		.poll(fields)
		.toEqual(['reviews', 'image', 'shipping', 'shop', 'rating', 'vouchers', 'price']);
	await expect(card.locator('[data-fact="price"]')).toHaveAttribute('data-raw', before!);
	await expect(page.locator('#products [data-proof]')).toHaveAttribute('data-proof', 'verified');
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect.poll(fields).toEqual(['summary', 'specs', 'price']);
});

test('visual and large-print cards work offline in both languages without page overflow', async ({
	page,
	context
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await page.getByRole('button', { name: 'Shopping assistant', exact: true }).click();
	await context.setOffline(true);
	await page.getByRole('button', { name: 'Visual vibrant', exact: true }).click();
	await expect(page.locator('[data-section="top-picks"] .adaptive-card')).toHaveCount(3);
	const card = page.locator('#products .adaptive-card').first();
	await expect(card.locator('[data-card-field="reviews"]')).toBeVisible();
	await expect(card.locator('[data-card-field="vouchers"]')).toBeVisible();
	await expect(card.locator('[data-card-field="rating"]')).toHaveCount(0);
	await page.getByRole('searchbox').fill('rice cooker');
	await page.getByRole('searchbox').press('Enter');
	await page.getByRole('button', { name: 'Mom mode', exact: true }).click();
	await expect(page.locator('.store')).toHaveAttribute('lang', 'th');
	await expect(card.locator('[data-card-field="shipping"]')).toBeVisible();
	await expect(card.locator('[data-card-field="rating"]')).toHaveCount(0);
	await expect
		.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
		.toBe(true);
	const font = await card.evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
	expect(font).toBeGreaterThanOrEqual(20);
	const caption = page.locator('#products [data-product="cooker-one-button"] .caption .capacity');
	expect(
		await caption.evaluate((node) => parseFloat(getComputedStyle(node).fontSize))
	).toBeGreaterThanOrEqual(20);
	await page.getByRole('button', { name: 'English', exact: true }).click();
	await expect(card.getByRole('button', { name: 'Best price' })).toBeVisible();
	await card.screenshot({ path: test.info().outputPath('adaptive-cards.png') });
	await expect(page.locator('#products [data-proof]')).toHaveAttribute('data-proof', 'verified');
});
