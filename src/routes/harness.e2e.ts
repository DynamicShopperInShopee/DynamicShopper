import { expect, test } from '@playwright/test';

test('orders and omits card fields offline, keeps the verified price, and reverses the change', async ({
	page,
	context
}) => {
	const assistantRequests: string[] = [];
	page.on('request', (request) => {
		if (request.url().includes('/api/')) assistantRequests.push(request.url());
	});
	await page.goto('/');
	await page.getByRole('link', { name: 'Explore the agent harness' }).click();
	await expect(page).toHaveURL(/\/harness#assistant$/);
	await context.setOffline(true);
	await page.getByRole('searchbox').fill('gaming mouse');
	await page.getByRole('searchbox').press('Enter');
	const input = page.getByRole('textbox', { name: 'Ask the store', exact: true });
	await input.fill('specs first, as a grid');
	await input.press('Enter');
	const card = page.locator('#products .adaptive-card').first();
	const fields = () =>
		card
			.locator('[data-card-field]')
			.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-card-field')));
	await expect.poll(fields).toEqual(['specs', 'price', 'rating', 'shop']);
	await expect(card.locator('[data-card-field="specs"] [data-fact]').first()).toBeVisible();
	await expect(card.locator('[data-card-field="image"]')).toHaveCount(0);
	await expect(page.locator('#products [data-proof]')).toHaveAttribute('data-proof', 'verified');
	const before = await card.locator('[data-fact="price"]').getAttribute('data-raw');
	await input.fill('photos');
	await input.press('Enter');
	await expect.poll(fields).toEqual(['image', 'price', 'summary', 'rating']);
	await expect(card.locator('[data-fact="price"]')).toHaveAttribute('data-raw', before!);
	await expect(page.locator('#products [data-proof]')).toHaveAttribute('data-proof', 'verified');
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect.poll(fields).toEqual(['specs', 'price', 'rating', 'shop']);
	await input.fill('find the best deal');
	await input.press('Enter');
	await expect(page.locator('.quote [data-deal-fact="total"]')).toBeVisible();
	await page.getByRole('button', { name: 'Reset store' }).click();
	await expect(page.locator('.quote')).toHaveCount(0);
	await expect(page.locator('.mode-label')).toHaveCount(0);
	expect(assistantRequests).toEqual([]);
});

test('keeps the standalone harness offline in production and its full-message endpoint closed', async ({
	page,
	request
}) => {
	await page.goto('/harness');
	await page.getByRole('button', { name: 'Shopping assistant', exact: true }).click();
	await page.getByRole('button', { name: 'X-ray', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Try live model' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Simulate poisoned model' })).toHaveCount(0);
	await page.getByRole('textbox', { name: 'Ask the store' }).fill('minimal');
	await page.getByRole('button', { name: 'Send', exact: true }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'minimal');
	await expect(page.getByText('Fallback reason: forced_offline')).toBeVisible();
	expect(
		(await request.post('/api/assistant', { data: { message: 'synthetic probe' } })).status()
	).toBe(404);
});

test('visual and large-print cards work offline in both languages without page overflow', async ({
	page,
	context
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/harness');
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

test('cooker capacity and free shipping also constrain both harness comparison panes', async ({
	page,
	context
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	await page.getByRole('link', { name: 'Explore the agent harness' }).click();
	await expect(page).toHaveURL(/\/harness#assistant$/);
	await context.setOffline(true);
	const filters = page.getByRole('navigation', { name: 'Rice cooker filters' });
	await filters.getByRole('button', { name: '1.8 L', exact: true }).click();
	await page.getByRole('button', { name: 'Compare views', exact: true }).click();
	const panes = page.locator('[data-compare-pane]');
	await expect(panes).toHaveCount(2);
	for (const pane of await panes.all()) {
		await expect(pane.locator('[data-product]')).toHaveCount(2);
		await expect(pane.locator('[data-product="cooker-one-button"]')).toBeVisible();
		await expect(pane.locator('[data-product="cooker-steamer"]')).toBeVisible();
	}
	await filters.getByRole('button', { name: 'Free shipping', exact: true }).click();
	for (const pane of await panes.all()) await expect(pane.locator('[data-product]')).toHaveCount(0);
	await filters.getByRole('button', { name: '2.2 L', exact: true }).click();
	for (const pane of await panes.all()) {
		await expect(pane.locator('[data-product]')).toHaveCount(1);
		await expect(pane.locator('[data-product]')).toHaveAttribute('data-product', 'cooker-family');
	}
});
