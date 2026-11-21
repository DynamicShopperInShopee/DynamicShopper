import { expect, test } from '@playwright/test';

test('keeps legacy links and shows the canonical cooker in both languages', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/product/cooker-1?lang=th');
	await expect(page.locator('main')).toHaveAttribute('data-product', 'cooker-one-button');
	await expect(page.locator('[data-fact="price"]')).toHaveText('690 บาท');
	await expect(page.locator('[data-fact="review.0"]')).toHaveText('แม่ใช้เองได้ ไม่ต้องคอยช่วย');
	await expect(page.locator('[data-fact="review.1"]')).toBeVisible();
	await expect(page.locator('[data-fact="summary"]')).toBeVisible();
	await expect(page.locator('[data-fact="reviewCount"]')).toHaveText('2,840');
	await expect(page.locator('[data-fact="reviewCount"]')).toHaveAttribute('data-raw', '2840');
	await page.getByRole('button', { name: 'สเปกสินค้า' }).click();
	await expect(page.getByRole('dialog').locator('[data-fact="spec.capacity"]')).toHaveText(
		'1.8 ลิตร'
	);
	await page.keyboard.press('Escape');
	await page.getByRole('link', { name: 'English' }).click();
	await expect(page).toHaveURL(/\/product\/cooker-1\?lang=en$/);
	await expect(page.locator('[data-fact="price"]')).toHaveText('฿690');
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
	await expect(page.getByRole('dialog').locator('[data-fact="spec.dpi"]')).toHaveText('12,000');
	await page.getByRole('button', { name: 'Done' }).click();
	await page.getByRole('button', { name: 'Best price' }).click();
	await expect(page.getByRole('heading', { name: 'Best deal' })).toBeVisible();
	await expect(page.locator('[data-deal-fact="total"]')).toHaveText('฿1,193');
	await expect(page.locator('[data-deal-fact="total"]')).toHaveAttribute('data-raw', '1193');
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
});
