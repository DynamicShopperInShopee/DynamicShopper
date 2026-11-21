import { expect, test } from '@playwright/test';

test('searches, sorts and filters the simulated catalog offline on mobile', async ({
	page,
	context
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/?view=receipt');
	await expect(page.locator('.store')).toHaveAttribute('lang', 'en');
	await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
	await expect(page.getByRole('heading', { name: 'Browse products' })).toBeVisible();
	await context.setOffline(true);

	await page.getByRole('searchbox').fill('gaming mouse');
	await page.getByRole('button', { name: 'Search', exact: true }).click();
	const cards = page.locator('[data-product]');
	await expect(cards).toHaveCount(8);

	await page.getByLabel('Sort by').selectOption('price-low');
	const price = cards.first().locator('[data-fact="price"]');
	await expect(price).toHaveText('฿1,190');
	await expect(price).toHaveAttribute('data-raw', '1190');

	await page.getByRole('button', { name: 'Filters', exact: true }).click();
	await page.getByLabel('Maximum price (฿)').fill('1500');
	await page.getByLabel('Free shipping only').check();
	await page.getByRole('button', { name: 'Apply filters' }).click();
	await expect(cards).toHaveCount(1);

	await page.getByRole('button', { name: 'Clear filters' }).click();
	await expect(cards).toHaveCount(8);

	for (const [languageButton, themeLabel, heading] of [
		['ไทย', 'ธีม', 'เลือกดูสินค้า'],
		['English', 'Theme', 'Browse products']
	]) {
		await page.getByRole('button', { name: languageButton, exact: true }).click();
		await expect(page.getByRole('heading', { name: heading })).toBeVisible();
		for (const theme of ['standard', 'minimal', 'vibrant', 'large']) {
			await page.getByLabel(themeLabel).selectOption(theme);
			await expect(page.locator('.store')).toHaveAttribute('data-theme', theme);
			for (const [width, height] of [
				[390, 844],
				[1440, 900]
			]) {
				await page.setViewportSize({ width, height });
				expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
			}
		}
	}
	await expect(cards).toHaveCount(8);
});

test('renders the event demo grid and filters in a modal drawer', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await expect(page.locator('.store')).toHaveClass(/event-demo/);
	await expect(page.locator('.store')).toHaveAttribute('lang', 'en');
	await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
	await page.evaluate(() => window.scrollTo(0, 900));
	await expect.poll(async () => (await page.getByRole('search').boundingBox())?.y).toBe(0);
	await expect
		.poll(async () => (await page.getByRole('navigation', { name: 'Categories' }).boundingBox())?.y)
		.toBe(56);
	await page.evaluate(() => window.scrollTo(0, 0));
	const cards = page.locator('[data-product]');
	await expect
		.poll(async () => (await cards.nth(1).boundingBox())?.y)
		.toBe((await cards.first().boundingBox())?.y);

	await page.getByRole('button', { name: 'Top sales', exact: true }).click();
	await expect(cards.first().locator('[data-fact="sold"]')).toHaveAttribute('data-raw', '56000');
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);

	await page.getByRole('button', { name: 'Price: low to high', exact: true }).click();
	await expect(cards.first().locator('[data-fact="price"]')).toHaveAttribute('data-raw', '189');

	await page.getByRole('button', { name: 'Filters', exact: true }).click();
	const drawer = page.getByRole('dialog', { name: 'Filters' });
	await expect(drawer).toBeVisible();
	await drawer.getByLabel('Maximum price (฿)').fill('200');
	await drawer.getByRole('button', { name: 'Apply filters' }).click();
	await expect(drawer).toBeHidden();
	await expect(cards).toHaveCount(1);
});

test('opens a rice cooker from the shelf and reads its catalog specifications', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await page.locator('[data-product="cooker-1"]').getByRole('link').click();
	await expect(page).toHaveURL(/\/product\/cooker-1/);
	await expect(page.locator('[data-fact="price"]')).toHaveAttribute('data-raw', '690');
	await page.getByText('Specifications', { exact: true }).click();
	await expect(page.locator('[data-fact="capacity"]')).toHaveText('1.8 L');
	await page.getByRole('link', { name: 'ไทย' }).click();
	await expect(page.locator('[data-fact="name"]')).toContainText('หม้อหุงข้าว');
});
