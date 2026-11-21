import { expect, test } from '@playwright/test';
import { vouchers } from '../lib/catalog';
import { optimizeDeal } from '../lib/pricing';

test('moves from an explicit mouse search to Mom mode without losing the undo state', async ({
	page,
	context
}) => {
	await page.goto('/?view=receipt');
	await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
	await context.setOffline(true);
	await page.getByRole('searchbox').fill('gaming mouse');
	await page.getByRole('button', { name: 'Search', exact: true }).click();
	await expect(page.locator('#products [data-product]')).toHaveCount(8);
	await page.getByRole('textbox', { name: 'Ask the store' }).fill('ซื้อของขวัญให้แม่ หม้อหุงข้าว ใช้ง่ายๆ');
	await page.getByRole('button', { name: 'Send' }).click();
	await expect(page.locator('#products [data-product]')).toHaveCount(3);
	await expect(page.locator('#products [data-product="cooker-one-button"]')).toBeVisible();
	await expect(page.getByRole('searchbox')).toHaveValue('');
	await page.getByRole('button', { name: 'ย้อนกลับ' }).click();
	await expect(page.getByRole('searchbox')).toHaveValue('gaming mouse');
	await expect(page.locator('#products [data-product]')).toHaveCount(8);
});

test('refreshes an open shelf quote when a voucher expires offline', async ({ page, context }) => {
	const openedAt = Date.UTC(2026, 10, 21);
	const expiry = vouchers.find(({ code }) => code === 'MEGA8')!.expiresAfterMs;
	const basket = [{ productId: 'titan-max', quantity: 1 }];
	const before = optimizeDeal(basket, { openedAt, now: openedAt + expiry - 1 })!;
	const after = optimizeDeal(basket, { openedAt, now: openedAt + expiry })!;
	await page.clock.install({ time: openedAt - 1000 });
	await page.clock.pauseAt(openedAt);
	await page.goto('/?view=receipt');
	await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
	await context.setOffline(true);
	await page.clock.fastForward(expiry - 1);
	await page
		.locator('#products [data-product="titan-max"]')
		.getByRole('button', { name: 'Best price' })
		.dispatchEvent('click');
	const total = page.locator('[data-deal-fact="total"]');
	await expect(total).toHaveAttribute('data-raw', String(before.total));
	await page.clock.runFor(1);
	await expect(total).toHaveAttribute('data-raw', String(after.total));
});

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
	await page.getByRole('button', { name: 'Reset store' }).click();
	await expect(items).toHaveCount(0);
	await expect(page.locator('.mode-label')).toHaveCount(0);
	await expect(sort).toHaveValue('default');
});

test('adapts and reverses the shelf offline and compares the same cooker deal', async ({
	page,
	context
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/?view=receipt');
	await expect(page.getByRole('button', { name: 'Compare views' })).toBeEnabled();
	await context.setOffline(true);
	const views = page.getByRole('button', { name: 'Shopper views' });
	const tech = page.getByRole('button', { name: 'Tech minimal' });
	await expect(tech).toBeHidden();
	await views.press('Space');
	await expect(views).toHaveAttribute('aria-expanded', 'true');
	await page.keyboard.press('Tab');
	await expect(page.locator('#shopper-presets button').first()).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(tech).toBeHidden();
	await expect(views).toBeFocused();
	await views.press('Enter');
	await tech.click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'minimal');
	await page.getByRole('button', { name: 'Undo' }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'standard');
	await views.click();
	await expect(tech).toBeHidden();
	await page.getByRole('button', { name: 'Chat with the assistant' }).click();
	await page.getByRole('textbox', { name: 'Ask the store' }).fill('ซื้อของขวัญให้แม่ หม้อหุงข้าว ใช้ง่ายๆ');
	await page.getByRole('button', { name: 'Send' }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'large');
	await expect(page.locator('.store')).toHaveAttribute('lang', 'th');
	await expect(page.locator('#products [data-product]')).toHaveCount(3);
	await page.keyboard.press('Escape');
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

test('disables live experimentation on the production storefront', async ({ page, request }) => {
	await page.goto('/?view=receipt');
	await page.getByRole('button', { name: 'X-ray' }).click();
	await expect(page.getByRole('button', { name: 'Try live model' })).toHaveCount(0);
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
	await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
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
	await page.getByRole('link', { name: 'Shopping assistant' }).press('Enter');
	await expect(page.getByRole('textbox', { name: 'Ask the store' })).toBeFocused();
	await expect(page.getByRole('textbox', { name: 'Ask the store' })).toBeVisible();
});

test('rice cooker filters pin below search and select the catalog capacity', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	const strip = page.getByRole('navigation', { name: 'Rice cooker filters' });
	const cards = page.locator('.product-grid > li');
	await expect(strip).toBeVisible();
	await page.evaluate(() => scrollTo(0, 500));
	await expect.poll(async () => (await strip.boundingBox())?.y).toBe(56);
	await strip.getByRole('button', { name: '1.8 L', exact: true }).click();
	await expect(cards).toHaveCount(2);
	await page.getByLabel('Sort by').selectOption('price-high');
	await expect(cards.first()).toHaveAttribute('data-product', 'cooker-steamer');
	await expect(page.getByRole('heading', { name: 'Price: high to low' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Shopping assistant' })).toHaveAttribute(
		'href',
		'/?view=receipt#assistant'
	);
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
	await expect(page.locator('.product-grid .art').first()).toHaveAttribute('data-category', 'skin');
});

test('compacts the cooker controls without displacing the product shelf', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	await page.evaluate(() => document.fonts.ready);
	const strip = page.getByRole('navigation', { name: 'Rice cooker filters' });
	const shelf = page.locator('.product-grid');
	const position = () =>
		shelf.evaluate((element) => Math.round(element.getBoundingClientRect().top + window.scrollY));

	await page.evaluate(() => scrollTo(0, 179));
	await expect(strip).not.toHaveClass(/condensed/);
	const expandedPosition = await position();
	const expandedHeight = (await strip.boundingBox())!.height;
	await page.evaluate(() => scrollTo(0, 181));
	await expect(strip).toHaveClass(/condensed/);
	expect((await strip.boundingBox())!.height).toBeLessThan(expandedHeight);
	await expect.poll(position).toBe(expandedPosition);
});

test('opens the interview from the category results quick controls', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
	await page.getByRole('button', { name: 'Skincare', exact: true }).click();
	const strip = page.getByRole('navigation', { name: 'Skincare filters' });
	const interview = strip.getByRole('button', { name: 'Start a quick interview' });
	await interview.click();
	const dialog = page.getByRole('dialog', { name: 'Make the shop fit you' });
	await expect(dialog).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(interview).toBeFocused();
	await expect(page.locator('.product-grid .art').first()).toHaveAttribute('data-category', 'skin');
});

test('restores a filtered Thai shelf on browser and listing return without sharing the search', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	await page.getByRole('searchbox').fill('rice cooker');
	await page.getByRole('searchbox').press('Enter');
	await page.getByRole('button', { name: '1.8 L', exact: true }).click();
	await page.getByLabel('Sort by').selectOption('price-high');
	await page.getByRole('button', { name: 'ไทย', exact: true }).click();
	const cards = page.locator('.product-grid > li');
	for (const method of ['browser', 'header', 'search']) {
		await expect(cards).toHaveCount(2);
		await expect(cards.first()).toHaveAttribute('data-product', 'cooker-steamer');
		await cards.first().getByRole('link').click();
		await expect(page).toHaveURL(/\/product\/cooker-6\?lang=th&theme=standard$/);
		if (method === 'browser') await page.goBack();
		else
			await page
				.getByRole('link', { name: method === 'header' ? 'กลับหน้าร้าน' : 'ค้นหาสินค้า' })
				.click();
		await expect(page.locator('.store')).toHaveAttribute('lang', 'th');
		await expect(page.getByRole('searchbox')).toHaveValue('rice cooker');
	}
	await expect(cards).toHaveCount(2);
	await expect(page.getByRole('button', { name: '1.8 ลิตร', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
});

test('returns to the visible row of rice cooker results', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	await page.evaluate(() => document.fonts.ready);
	const chosen = page.locator('.product-grid > li').nth(2).getByRole('link');
	for (const method of ['browser', 'header', 'search']) {
		await page.evaluate(() => scrollTo(0, 320));
		await expect(chosen).toBeInViewport();
		const rowOffset = await page.evaluate(() => window.scrollY);
		expect(rowOffset).toBeGreaterThan(200);
		await chosen.click();
		await expect(page.locator('main[data-product]')).toBeVisible();
		if (method === 'browser') await page.goBack();
		else
			await page
				.getByRole('link', { name: method === 'header' ? 'Back to store' : 'Search products' })
				.click();
		await expect(page.locator('.product-grid > li')).toHaveCount(6);
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(rowOffset);
	}
});

test('keeps category search controls ahead of the mobile results', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
	await page.getByRole('button', { name: 'Skincare', exact: true }).click();
	const filters = page.getByRole('navigation', { name: 'Skincare filters' });
	const free = filters.getByRole('button', { name: 'Free shipping', exact: true });
	await expect(free).toBeInViewport({ ratio: 1 });
	await free.click();
	await expect(free).toHaveAttribute('aria-pressed', 'true');
	await expect(
		page.locator('.product-grid > li').first().locator('[data-fact="shipping"]')
	).toHaveAttribute('data-raw', '0');
	await free.click();
	const heading = page.locator('#products-heading');
	await expect(heading).toBeAttached();
	const strip = await filters.boundingBox();
	const firstRow = await page.locator('.product-grid').boundingBox();
	expect(firstRow!.y - strip!.y - strip!.height).toBeLessThan(12);
	await expect(filters.getByRole('link', { name: 'Shopping assistant' })).toHaveAttribute(
		'href',
		'/?view=receipt#assistant'
	);
	await filters.getByLabel('Categories').selectOption('cooker');
	const search = page.getByRole('search');
	const box = await search.getByRole('searchbox').boundingBox();
	const submit = await search.getByRole('button', { name: 'Search', exact: true }).boundingBox();
	expect(submit!.width).toBeGreaterThanOrEqual(44);
	expect(submit!.height).toBeGreaterThanOrEqual(44);
	expect(Math.abs(submit!.x - box!.x)).toBeLessThanOrEqual(2);
	const cookerFilters = page.getByRole('navigation', { name: 'Rice cooker filters' });
	const chipRow = cookerFilters.locator('.chips');
	await chipRow.evaluate((node) => {
		node.scrollLeft = node.scrollWidth;
	});
	await expect.poll(() => chipRow.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
	await cookerFilters.getByLabel('Categories').selectOption('skin');
	await expect(free).toBeInViewport({ ratio: 1 });
	await filters.getByLabel('Categories').selectOption('cooker');
	await search.getByRole('searchbox').fill('steamer');
	await search.getByRole('button', { name: 'Search', exact: true }).click();
	await expect(page.locator('.product-grid > li')).toHaveCount(1);
});

test('a repeated persona request keeps explicit English and needs only one undo', async ({
	page,
	context
}) => {
	await page.goto('/?view=receipt');
	await page.getByRole('button', { name: 'ไทย', exact: true }).click();
	await page.getByRole('button', { name: 'English', exact: true }).click();
	await context.setOffline(true);
	const store = page.locator('.store');
	async function send(message: string) {
		await page.getByRole('textbox', { name: 'Ask the store' }).fill(message);
		await page.getByRole('button', { name: 'Send', exact: true }).click();
		await expect(page.getByRole('textbox', { name: 'Ask the store' })).toHaveValue('');
	}
	await send('I am shopping for my mom');
	await expect(store).toHaveAttribute('lang', 'en');
	await expect(store).toHaveAttribute('data-theme', 'large');
	await send('I am shopping for my mom');
	await send('undo');
	await expect(store).toHaveAttribute('data-theme', 'standard');
	await send('I am shopping for my mom');
	await expect(store).toHaveAttribute('data-theme', 'large');
	await expect(store).toHaveAttribute('lang', 'en');
});
