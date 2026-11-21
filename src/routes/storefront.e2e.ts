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
	const gallery = page.getByRole('region', { name: 'Product photos' });
	const mainPhoto = gallery.getByRole('button', { name: 'Main photo' });
	const secondPhoto = gallery.getByRole('button', { name: 'Alternate photo' });
	await expect(mainPhoto).toHaveAttribute('aria-pressed', 'true');
	await secondPhoto.focus();
	await page.keyboard.press('Enter');
	await expect(secondPhoto).toHaveAttribute('aria-pressed', 'true');
	await expect(
		gallery.getByRole('img', { name: 'Rice cooker on a kitchen counter' })
	).toBeInViewport();
	await gallery.locator('.photos').evaluate((element) => element.scrollTo(0, 0));
	await expect(mainPhoto).toHaveAttribute('aria-pressed', 'true');

	const actions = page.getByRole('navigation', { name: 'Product actions' });
	await expect(actions).toBeInViewport();
	const actionBox = await actions.boundingBox();
	expect((actionBox?.y ?? 0) + (actionBox?.height ?? 0)).toBe(844);

	const listing = page.locator('.listing');
	await expect(listing.locator('[data-fact="price"]')).toHaveAttribute('data-raw', '690');
	const shipping = page.locator('[data-fact="shipping"]');
	await expect(shipping).toHaveText('฿50');
	const shippingLabel = page.getByText('Shipping', { exact: true });
	const labelBox = await shippingLabel.boundingBox();
	const feeBox = await shipping.boundingBox();
	expect(feeBox?.y ?? 0).toBeGreaterThan(labelBox?.y ?? 0);
	await expect(listing.locator('[data-fact="rating"]')).toHaveCount(0);
	const reviews = page.getByRole('region', { name: 'Product reviews' });
	await expect(reviews.locator('[data-fact="rating"]')).toHaveText('4.8');
	await actions.getByRole('button', { name: 'Specifications' }).click();
	const sheet = page.getByRole('dialog', { name: 'Specifications' });
	await expect(sheet).toBeVisible();
	const sheetBox = await sheet.boundingBox();
	expect(sheetBox?.height ?? 0).toBeGreaterThan(844 * 0.8);
	expect((sheetBox?.y ?? 0) + (sheetBox?.height ?? 0)).toBe(844);
	await expect(sheet.getByRole('button', { name: 'Done' })).toBeInViewport();
	await expect(sheet.locator('[data-fact="capacity"]')).toHaveText('1.8 L');
	await sheet.getByRole('button', { name: 'Done' }).click();
	await expect(sheet).toBeHidden();
	await actions.getByRole('link', { name: 'Details' }).click();
	const details = page.getByRole('region', { name: 'Product details' });
	await expect(details.locator('[data-fact="power"]')).toHaveText('700 W');
	const specsRow = details.getByRole('button', { name: 'Specifications' });
	await expect(specsRow).toBeVisible();
	// Some browsers activate a clicked button without focusing it first.
	await specsRow.evaluate((button: HTMLButtonElement) => button.click());
	await expect(sheet).toBeVisible();
	await expect(sheet.locator('[data-fact="capacity"]')).toHaveText('1.8 L');
	await page.keyboard.press('Escape');
	await expect(sheet).toBeHidden();
	await expect(specsRow).toBeFocused();
	const openCooker = details.getByRole('img', { name: 'Open rice cooker with cooked rice' });
	await openCooker.scrollIntoViewIfNeeded();
	await expect
		.poll(() => openCooker.evaluate((image: HTMLImageElement) => image.naturalWidth))
		.toBeGreaterThan(0);
	await expect(page.locator('main header')).toHaveAttribute('data-over-hero', 'false');
	await page.evaluate(() => window.scrollTo(0, 0));
	await expect(page.locator('main header')).toHaveAttribute('data-over-hero', 'true');
	await page.getByRole('link', { name: 'ไทย' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toContainText('หม้อหุงข้าว');
	await expect(page.locator('[data-fact="review"]')).toHaveText('แม่ใช้เองได้โดยไม่ต้องมีคนช่วย');
	await page.getByRole('link', { name: 'รีวิว', exact: true }).click();
	await expect(page).toHaveURL(/#reviews$/);
});

test('browses items from the same seller and opens one in the current language', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/product/cooker-1?lang=th');
	const more = page.getByRole('region', { name: 'สินค้าอื่นจากร้านนี้' });
	await expect(more.getByRole('link')).toHaveCount(3);
	await expect(more.locator('[data-fact="sold"]')).toHaveText(['11,000', '9,200', '5,300']);
	const steamer = more.getByRole('link', { name: /หม้อหุงข้าวพร้อมถาดนึ่ง/ });
	await expect(steamer.locator('[data-fact="price"]')).toHaveText('฿890');
	await expect(steamer.locator('[data-fact="sold"]')).toHaveAttribute('data-raw', '11000');
	const shelf = more.getByRole('list');
	await shelf.hover();
	await page.mouse.wheel(140, 0);
	await expect.poll(() => shelf.evaluate((list) => list.scrollLeft)).toBeGreaterThan(0);
	const family = more.getByRole('link', { name: /หม้อหุงข้าวสำหรับครอบครัว/ });
	await family.focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/product\/cooker-3\?lang=th$/);
	await expect(page.getByRole('heading', { level: 1 })).toContainText('หม้อหุงข้าวสำหรับครอบครัว');
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
