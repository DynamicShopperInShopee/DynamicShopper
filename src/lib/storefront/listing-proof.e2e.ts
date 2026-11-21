import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('checks each visible cooker capacity and rejects a damaged occurrence', async ({ page }) => {
	await page.goto('/product/cooker-one-button?lang=th&theme=large&view=receipt');
	const proof = page.locator('main > [data-proof]');
	const capacity = '[data-product-id="cooker-one-button"][data-fact="spec.capacity"]';
	const galleryFact = page.getByRole('region', { name: 'รูปสินค้า' }).locator(capacity);
	const summaryFact = page.locator('section[aria-labelledby="product-title"]').locator(capacity);
	const illustrationFact = page.locator('#cooker-capacity').locator(capacity);
	await expect(proof).toHaveAttribute('data-proof', 'verified');
	for (const occurrence of [galleryFact, summaryFact, illustrationFact]) {
		await expect(occurrence).toBeVisible();
		await expect(occurrence).toHaveText('1.8 ลิตร');
		await expect(occurrence).toHaveAttribute('data-raw', '1.8');
		await expect(occurrence).toHaveAttribute('data-source', 'catalog');
	}

	await illustrationFact.evaluate((node) => (node.textContent = '1 ลิตร'));
	await expect(proof).toHaveAttribute('data-proof', 'failed');
	await expect(summaryFact).toHaveText('1.8 ลิตร');
	await expect(galleryFact).toHaveText('1.8 ลิตร');
	await illustrationFact.evaluate((node) => (node.textContent = '1.8 ลิตร'));
	await expect(proof).toHaveAttribute('data-proof', 'verified');

	await page
		.getByRole('navigation', { name: 'การทำงานกับสินค้า' })
		.getByRole('button', { name: 'สเปกสินค้า', exact: true })
		.click();
	const sheet = page.getByRole('dialog', { name: 'สเปกสินค้า', exact: true });
	const sheetFact = sheet.locator(capacity);
	await expect(sheetFact).toHaveText('1.8 ลิตร');
	await expect(sheetFact).toHaveAttribute('data-raw', '1.8');
	await expect(sheetFact).toHaveAttribute('data-source', 'catalog');
	await expect(proof).toHaveAttribute('data-proof', 'verified');
	await sheetFact.evaluate((node) => node.removeAttribute('data-source'));
	await expect(proof).toHaveAttribute('data-proof', 'failed');
	await sheet.getByRole('button', { name: 'ตกลง', exact: true }).click();
	await expect(proof).toHaveAttribute('data-proof', 'verified');
});

test('distinguishes the shop rating and retains a shared look through seller navigation', async ({
	page
}) => {
	const look = Buffer.from(
		JSON.stringify({ theme: 'large-print', layout: 'list', locale: 'th' })
	).toString('base64url');
	const query = new URLSearchParams({ view: 'receipt', lang: 'th', theme: 'large', look });
	await page.goto('/product/cooker-steamer?' + query.toString());
	const proof = page.locator('main > [data-proof]');
	await expect(proof).toHaveAttribute('data-proof', 'verified');
	const productRating = page.locator(
		'#reviews [data-product-id="cooker-steamer"][data-fact="rating"]'
	);
	const shopRating = page.locator('[data-product-id="cooker-steamer"][data-fact="shopRating"]');
	for (const [rating, expected] of [
		[productRating, '4.6'],
		[shopRating, '4.8']
	] as const) {
		await expect(rating).toHaveText(expected);
		await expect(rating).toHaveAttribute('data-raw', expected);
		await expect(rating).toHaveAttribute('data-source', 'catalog');
	}

	await page.getByRole('button', { name: 'ดูร้านค้า', exact: true }).click();
	const inventory = page.getByRole('dialog', { name: /HomeKrua/ });
	await inventory
		.getByRole('link')
		.filter({ has: page.locator('[data-product-id="cooker-one-button"][data-fact="name"]') })
		.click();
	await expect(page.locator('main')).toHaveAttribute('data-product', 'cooker-one-button');
	const hasLook = (url: URL) =>
		url.searchParams.get('view') === 'receipt' && url.searchParams.get('look') === look;
	await expect(page).toHaveURL(hasLook);
	await expect(proof).toHaveAttribute('data-proof', 'verified');

	await page.getByRole('link', { name: 'กลับหน้าร้าน', exact: true }).click();
	await expect(page).toHaveURL((url) => url.pathname === '/' && hasLook(url));
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'large');
	await expect(page.locator('.store')).toHaveAttribute('lang', 'th');
});
