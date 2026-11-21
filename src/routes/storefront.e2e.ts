import { expect, test } from '@playwright/test';

test('verifies rendered Thai facts and withdraws the proof when the price changes', async ({
	page
}) => {
	await page.goto('/?view=receipt');
	await page.getByRole('button', { name: 'ไทย', exact: true }).click();
	const cooker = page.locator('[data-product="cooker-one-button"]');
	const price = cooker.locator('[data-fact="price"]');
	await expect(price).toHaveText('690 บาท');
	await expect(price).toHaveAttribute('data-raw', '690');
	await expect(page.getByText('ตรวจสอบข้อมูลแล้ว')).toBeVisible();
	await price.evaluate((element) => {
		element.textContent = '1 บาท';
	});
	await expect(page.getByText('พบข้อมูลที่ไม่ตรงกับแค็ตตาล็อก')).toBeVisible();
	await expect(page.getByText('ตรวจสอบข้อมูลแล้ว')).toHaveCount(0);
	await price.evaluate((element) => {
		element.textContent = '690 บาท';
	});
	await expect(page.getByText('ตรวจสอบข้อมูลแล้ว')).toBeVisible();
	await price.evaluate((element) => {
		element.removeAttribute('data-fact');
		element.removeAttribute('data-product-id');
	});
	await expect(page.getByText('พบข้อมูลที่ไม่ตรงกับแค็ตตาล็อก')).toBeVisible();
});

test('preserves explicit sorting and prices each chat-selected product offline', async ({
	page,
	context
}) => {
	await page.goto('/?view=receipt');
	await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
	await context.setOffline(true);
	const sort = page.getByLabel('Sort by');
	await sort.selectOption('price-high');
	await page.getByRole('textbox', { name: 'Ask the store' }).fill('minimal and compact');
	await page.getByRole('button', { name: 'Send' }).click();
	await expect(sort).toHaveValue('price-high');
	await expect(page.locator('.store')).toHaveAttribute('data-density', 'compact');
	await page
		.getByRole('textbox', { name: 'Ask the store' })
		.fill('best deal for pixel-mini and aero-x');
	await page.getByRole('button', { name: 'Send' }).click();
	await expect(page.getByText('Calculated from catalog')).toBeVisible();
	const items = page.locator('[data-deal-fact="itemSubtotal"]');
	await expect(items).toHaveCount(2);
	await expect(items.nth(0)).toHaveAttribute('data-raw', '1450');
	await expect(items.nth(1)).toHaveAttribute('data-raw', '1590');
	await expect(sort).toHaveValue('price-high');
});

test('adapts and reverses the shelf offline and compares the same cooker deal', async ({
	page,
	context
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/?view=receipt');
	await expect(page.getByRole('button', { name: 'Compare views' })).toBeEnabled();
	await context.setOffline(true);
	await page.getByRole('textbox', { name: 'Ask the store' }).fill('ซื้อของขวัญให้แม่ หม้อหุงข้าว ใช้ง่ายๆ');
	await page.getByRole('button', { name: 'Send' }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'large');
	await expect(page.locator('.store')).toHaveAttribute('lang', 'th');
	await expect(page.locator('#products [data-product]')).toHaveCount(3);
	await page.getByRole('button', { name: 'ย้อนกลับ' }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'standard');
	await page.getByRole('searchbox').fill('rice cooker');
	await page.getByRole('button', { name: 'Search', exact: true }).click();
	await page.getByRole('button', { name: 'Compare views' }).click();
	await expect(page.getByText('Shared facts match')).toBeVisible();
	const panels = page.locator('[data-compare-pane]');
	const cookerId = '[data-product="cooker-one-button"]';
	await expect(panels.nth(0).locator(`${cookerId} [data-fact="price"]`)).toHaveText('฿690');
	await expect(panels.nth(1).locator(`${cookerId} [data-fact="price"]`)).toHaveText('690 บาท');
	await panels.nth(0).locator(cookerId).getByRole('button', { name: 'Best price' }).click();
	await expect(page.locator('[data-deal-fact="total"]')).toHaveAttribute('data-raw', '585');
	await panels.nth(1).locator(cookerId).getByRole('button', { name: 'ราคาดีที่สุด' }).click();
	await expect(page.locator('[data-deal-fact="total"]')).toHaveAttribute('data-raw', '585');
});

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
			await page.getByLabel(themeLabel, { exact: true }).selectOption(theme);
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
	for (const model of ['mouse-1', 'cooker-1', 'earbuds-1']) {
		const photo = page.locator('.art[data-model="' + model + '"]');
		await expect(photo).toHaveCSS('background-image', /url\(/);
		await expect(photo).toHaveCSS('background-size', /cover|300% 200%/);
	}
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
	const photo = page.locator('[data-product="cooker-one-button"] .art');
	await photo.scrollIntoViewIfNeeded();
	await page.mouse.click(
		...(await photo.evaluate((element) => {
			const { x, y, width, height } = element.getBoundingClientRect();
			return [x + width / 2, y + height / 2] as const;
		}))
	);
	await expect(page).toHaveURL(/\/product\/cooker-1/);
	await expect(
		page.locator('[data-product-id="cooker-one-button"][data-fact="price"]').first()
	).toHaveAttribute('data-raw', '690');
	await page
		.getByRole('navigation', { name: 'Product actions' })
		.getByRole('button', { name: 'Specifications' })
		.click();
	const sheet = page.getByRole('dialog', { name: 'Specifications' });
	await expect(sheet).toBeVisible();
	await expect(sheet.locator('[data-fact="spec.capacity"]')).toHaveText('1.8 L');
	await sheet.getByRole('button', { name: 'Done' }).click();
	await expect(sheet).toBeHidden();
	await page.getByRole('link', { name: 'ไทย' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toContainText('หม้อหุงข้าว');
	await expect(page.locator('[data-fact="review.0"]')).toHaveText('แม่ใช้เองได้ ไม่ต้องคอยช่วย');
	await page.getByRole('link', { name: 'รีวิว', exact: true }).click();
	await expect(page).toHaveURL(/#reviews$/);
});

test('serves the storefront without credentials and isolates unconfigured demo auth', async ({
	page,
	request
}) => {
	const response = await page.goto('/');
	expect(response?.status()).toBe(200);
	await expect(page.getByRole('heading', { name: 'Browse products' })).toBeVisible();
	const auth = await request.get('/api/auth/get-session', { failOnStatusCode: false });
	expect(auth.status()).toBe(503);
});

test('keeps production model endpoints disabled and falls back safely', async ({
	page,
	request
}) => {
	await page.goto('/?view=receipt');
	await page.getByRole('button', { name: 'X-ray' }).click();
	await expect(page.getByRole('button', { name: 'Simulate poisoned model' })).toHaveCount(0);
	await page.getByRole('button', { name: 'Try live model' }).click();
	await page.getByRole('textbox', { name: 'Ask the store', exact: true }).fill('minimal');
	await page.getByRole('button', { name: 'Send', exact: true }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'minimal');
	await expect(page.getByText('Fallback reason: api_error')).toBeVisible();
	const assistant = await request.post('/api/assistant', {
		data: { message: 'hello', poison: true }
	});
	expect(assistant.status()).toBe(404);
	const result = await request.post('/api/local-assistant', {
		headers: { origin: new URL(page.url()).origin },
		data: { hints: ['playful'] }
	});
	expect(result.status()).toBe(404);
});

test('shops rice cooker results from the default mobile storefront and opens the adaptive assistant', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	const shops = page.getByRole('region', { name: 'Matching shops' });
	await expect(shops).toBeVisible();
	await shops.getByRole('button', { name: 'View shop' }).click();
	const inventory = page.getByRole('dialog');
	await expect(inventory.getByRole('link').first()).toBeVisible();
	await inventory.getByRole('button', { name: 'Close' }).click();
	await shops.getByRole('link').first().click();
	await expect(page).toHaveURL(/\/product\/cooker-/);
	await page.getByRole('link', { name: 'Back to store' }).click();
	await page.getByRole('button', { name: 'Shopping assistant', exact: true }).click();
	await expect(page.getByRole('textbox', { name: 'Ask the store' })).toBeVisible();
});

test('rice cooker filters pin below search and select the catalog capacity', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	const strip = page.getByRole('navigation', { name: 'Rice cooker filters' });
	const cards = page.locator('#products [data-product]');
	await expect(strip).toBeVisible();
	await page.evaluate(() => scrollTo(0, 500));
	await expect.poll(async () => (await strip.boundingBox())?.y).toBe(56);
	await strip.getByRole('button', { name: '1.8 L', exact: true }).click();
	await expect(cards).toHaveCount(2);
	await page.getByLabel('Sort by').selectOption('price-high');
	await expect(cards.first()).toHaveAttribute('data-product', 'cooker-steamer');
	await expect(page.getByRole('heading', { name: 'Price: high to low' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Shopping assistant' })).toHaveCount(1);
	await expect(page.getByRole('button', { name: 'Capacity 1.8 L' })).toBeVisible();
	await strip.getByRole('button', { name: 'Filters' }).click();
	const drawer = page.getByRole('dialog', { name: 'Filters' });
	await drawer.getByRole('button', { name: 'Clear filters' }).click();
	await drawer.getByRole('button', { name: 'Close' }).click();
	await expect(strip.getByRole('button', { name: '1.8 L', exact: true })).toHaveAttribute(
		'aria-pressed',
		'false'
	);
	await expect(cards).toHaveCount(6);
	await expect(page.getByRole('button', { name: 'Capacity 1.8 L' })).toHaveCount(0);
	await strip.getByLabel('Categories').selectOption('skin');
	await expect(strip).toHaveCount(0);
	await expect(page.getByRole('region', { name: 'Matching shops' })).toBeVisible();
	await expect(page.locator('#products .demo-photo').first()).toHaveAttribute(
		'data-category',
		'skin'
	);
});
