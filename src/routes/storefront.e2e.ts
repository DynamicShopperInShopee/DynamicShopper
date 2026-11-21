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
	const photo = page.locator('[data-product="cooker-1"] .art');
	await photo.scrollIntoViewIfNeeded();
	await page.mouse.click(
		...(await photo.evaluate((element) => {
			const { x, y, width, height } = element.getBoundingClientRect();
			return [x + width / 2, y + height / 2] as const;
		}))
	);
	await expect(page).toHaveURL(/\/product\/cooker-1/);
	const hero = page.locator('main .art');
	const header = page.getByRole('link', { name: 'Back to store' });
	const heroBox = await hero.boundingBox();
	const headerBox = await header.boundingBox();
	expect(heroBox?.width).toBe(390);
	expect(heroBox?.height).toBe(390);
	expect(headerBox?.y ?? -1).toBeGreaterThanOrEqual(heroBox?.y ?? 0);
	expect((headerBox?.y ?? 0) - (heroBox?.y ?? 0)).toBeLessThan(24);
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
	const actions = page.getByRole('navigation', { name: 'Product actions' });
	await expect(actions).toBeInViewport();
	const actionBox = await actions.boundingBox();
	expect((actionBox?.y ?? 0) + (actionBox?.height ?? 0)).toBe(844);

	await expect(page.locator('[data-fact="price"]')).toHaveAttribute('data-raw', '690');
	await page.getByRole('button', { name: 'Specifications' }).click();
	const sheet = page.getByRole('dialog', { name: 'Specifications' });
	await expect(sheet).toBeVisible();
	await expect(sheet.locator('[data-fact="capacity"]')).toHaveText('1.8 L');
	await sheet.getByRole('button', { name: 'Done' }).click();
	await expect(sheet).toBeHidden();
	await actions.getByRole('link', { name: 'Details' }).click();
	const details = page.getByRole('region', { name: 'Product details' });
	await expect(details.locator('[data-fact="power"]')).toHaveText('700 W');
	await expect(page.locator('main header')).toHaveAttribute('data-over-hero', 'false');
	await page.evaluate(() => window.scrollTo(0, 0));
	await expect(page.locator('main header')).toHaveAttribute('data-over-hero', 'true');
	await page.getByRole('link', { name: 'ไทย' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toContainText('หม้อหุงข้าว');
	await expect(page.locator('[data-fact="review"]')).toHaveText('แม่ใช้เองได้โดยไม่ต้องมีคนช่วย');
	await page.getByRole('link', { name: 'รีวิว', exact: true }).click();
	await expect(page).toHaveURL(/#reviews$/);
});
