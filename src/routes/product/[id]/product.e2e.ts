import { expect, test } from '@playwright/test';

test('keeps legacy links and shows the canonical cooker in both languages', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/product/cooker-1?lang=th');
	await expect(page.locator('main')).toHaveAttribute('data-product', 'cooker-one-button');
	await expect(page.locator('[data-product-id="cooker-one-button"][data-fact="price"]')).toHaveText(
		'690 บาท'
	);
	await expect(page.locator('[data-fact="review.0"]')).toHaveText('แม่ใช้เองได้ ไม่ต้องคอยช่วย');
	await expect(page.locator('[data-fact="review.1"]')).toBeVisible();
	await expect(page.locator('#details [data-fact="summary"]')).toBeVisible();
	await expect(page.locator('[data-fact="reviewCount"]')).toHaveText('2,840');
	await expect(page.locator('[data-fact="reviewCount"]')).toHaveAttribute('data-raw', '2840');
	await page.getByRole('button', { name: 'สเปกสินค้า' }).click();
	await expect(
		page
			.getByRole('dialog', { name: /Specifications|สเปกสินค้า/ })
			.locator('[data-fact="spec.capacity"]')
	).toHaveText('1.8 ลิตร');
	await page.keyboard.press('Escape');
	await page.getByRole('link', { name: 'English' }).click();
	await expect(page).toHaveURL(/\/product\/cooker-1\?lang=en$/);
	await expect(page.locator('[data-product-id="cooker-one-button"][data-fact="price"]')).toHaveText(
		'฿690'
	);
	const gallery = page.getByRole('region', { name: 'Product photos' });
	await gallery.getByRole('button', { name: 'Alternate photo' }).click();
	await expect(gallery.getByRole('button', { name: 'Alternate photo' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect(
		gallery.getByRole('img', { name: 'Rice cooker on a kitchen counter' })
	).toBeInViewport();
	const width = await page.evaluate(() => document.documentElement.scrollWidth);
	expect(width).toBe(390);
	await page.goto('/product/cooker-one-button?theme=large');
	const control = page.getByRole('button', { name: 'Main photo' });
	const box = await control.boundingBox();
	expect(box?.width).toBeGreaterThanOrEqual(48);
	expect(box?.height).toBeGreaterThanOrEqual(48);
});

test('prices a canonical product offline and renders its category specs', async ({
	page,
	context
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/product/pixel-mini');
	await expect(page.locator('main')).toHaveAttribute('data-product', 'pixel-mini');
	await context.setOffline(true);
	await page.getByRole('button', { name: 'Specifications' }).click();
	await expect(
		page.getByRole('dialog', { name: /Specifications|สเปกสินค้า/ }).locator('[data-fact="spec.dpi"]')
	).toHaveText('12,000');
	await page.getByRole('button', { name: 'Done' }).click();
	await page.getByRole('button', { name: 'Best price' }).click();
	await expect(page.getByRole('heading', { name: 'Best deal' })).toBeVisible();
	await expect(page.locator('[data-deal-fact="total"]')).toHaveText('฿1,193');
	await expect(page.locator('[data-deal-fact="total"]')).toHaveAttribute('data-raw', '1193');
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
});

test('mobile listing places navigation over the photo and keeps the specification footer in view', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/product/cooker-one-button');
	const hero = page.locator('.art');
	expect((await hero.boundingBox())?.y).toBe(0);
	const search = page.getByRole('link', { name: 'Search products' });
	await expect(search).toBeInViewport();
	await page.getByRole('link', { name: 'Details', exact: true }).click();
	await expect(search).toBeInViewport();
	await expect(search.getByText('Search products')).toBeVisible();
	await page.getByRole('button', { name: 'Specifications', exact: true }).click();
	const sheet = page.getByRole('dialog', { name: /Specifications|สเปกสินค้า/ });
	expect((await sheet.boundingBox())!.height).toBeGreaterThan(844 * 0.8);
	await expect(sheet.getByRole('button', { name: 'Done' })).toBeInViewport();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('button', { name: 'Specifications', exact: true })).toBeFocused();
	const inline = page.getByRole('button', { name: 'View attributes', exact: true });
	await inline.click();
	await expect(sheet.getByRole('button', { name: 'Done' })).toBeInViewport();
	await sheet.getByRole('button', { name: 'Done' }).click();
	await expect(inline).toBeFocused();
	await page.getByRole('button', { name: 'Back to top' }).click();
	await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
	await expect(page.getByRole('link', { name: 'Back to store' })).toBeFocused();
});

test('searches catalog reviews offline and follows listing photos to their illustrated details', async ({
	page,
	context
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/product/cooker-1');
	await page.getByRole('link', { name: 'Reviews', exact: true }).click();
	const reviews = page.getByRole('region', { name: 'Product reviews' });
	const search = reviews.getByRole('searchbox');
	await context.setOffline(true);
	await search.fill('Mom');
	await expect(reviews.locator('blockquote')).toHaveCount(1);
	await expect(reviews.locator('blockquote')).toHaveText('Mom uses it without help');
	await search.fill('no matching excerpt');
	await expect(reviews.getByText('No reviews match your search.')).toBeVisible();
	await search.fill('');
	await expect(reviews.locator('blockquote')).toHaveCount(2);
	await reviews.getByRole('link', { name: 'Front switch' }).click();
	await expect(page).toHaveURL(/#cooker-switch$/);
	await expect(page.locator('#cooker-switch figcaption')).toBeInViewport();
	await expect(page.locator('[data-proof]')).toHaveAttribute('data-proof', 'verified');
});

test('skin pack shots use the same image and crop on the results and listing', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Skincare', exact: true }).click();
	const result = page.locator('.product-grid [data-product="vitamin-c-serum"]');
	const art = result.locator('.art');
	const style = await art.evaluate((node) => ({
		url: getComputedStyle(node).backgroundImage,
		position: getComputedStyle(node).backgroundPosition
	}));
	expect(style.url).toContain('skincare-variants');
	await result.getByRole('link').first().click();
	await expect(page.locator('main')).toHaveAttribute('data-product', 'vitamin-c-serum');
	await expect(page.locator('.art')).toHaveCSS('background-image', style.url);
	await expect(page.locator('.art')).toHaveCSS('background-position', style.position);
});

test('plays the local product overview on demand and returns to the gallery', async ({
	page,
	context
}) => {
	const clipReady = page.waitForResponse(
		(response) => response.url().includes('cooker-overview') && response.ok()
	);
	await page.goto('/product/cooker-1');
	await (await clipReady).finished();
	const gallery = page.getByRole('region', { name: 'Product photos' });
	await expect(gallery.locator('video')).toHaveCount(0);
	const play = gallery.getByRole('button', { name: 'Play rice cooker overview' });
	await context.setOffline(true);
	await play.click();
	await expect
		.poll(() => gallery.locator('video').evaluate((clip) => (clip as HTMLVideoElement).currentTime))
		.toBeGreaterThan(0);
	await gallery.getByRole('button', { name: /close video/i }).click();
	await expect(play).toBeFocused();
});
