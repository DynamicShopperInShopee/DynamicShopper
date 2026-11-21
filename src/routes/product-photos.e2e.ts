import { expect, test, type Locator } from '@playwright/test';

async function decodedPhoto(tile: Locator) {
	return tile.evaluate(async (element) => {
		const url = getComputedStyle(element).backgroundImage.match(/^url\("(.+)"\)$/)?.[1];
		if (!url) return null;
		const image = new Image();
		image.src = url;
		await image.decode();
		return {
			url,
			width: image.naturalWidth,
			position: getComputedStyle(element).backgroundPosition
		};
	});
}

for (const viewport of [
	{ width: 390, height: 844 },
	{ width: 1440, height: 900 }
]) {
	test(`product photography follows the shopper from the market into receipt and compare at ${viewport.width}px`, async ({
		page
	}) => {
		await page.setViewportSize(viewport);
		await page.goto('/');
		const digital = '[data-cooker-photo="cooker-digital"].demo-photo';
		const marketplace = await decodedPhoto(page.locator(digital).first());
		expect(marketplace?.width).toBeGreaterThan(0);
		await page.getByRole('link', { name: 'Shopping assistant' }).first().click();
		await expect(page).toHaveURL((url) => url.searchParams.get('view') === 'receipt');
		const card = page.locator('#products [data-product-card="cooker-digital"]');
		const assistantPhoto = card.locator('[data-card-field="image"]').locator(digital);
		await expect.poll(() => decodedPhoto(assistantPhoto)).toEqual(marketplace);
		await expect(page.locator('#products [data-product-card="clearcall"] .art svg')).toHaveCount(1);
		await page.goto('/compare?category=rice-cooker');
		await expect(page.locator(digital)).toHaveCount(1);
		expect(await decodedPhoto(page.locator(digital))).toEqual(marketplace);
		await page.goto('/product/cooker-digital');
		const gallery = page.getByRole('region', { name: 'Product photos' });
		expect(
			await gallery
				.locator('img')
				.first()
				.evaluate((image: HTMLImageElement) => image.src)
		).toEqual(marketplace!.url);
	});
}
