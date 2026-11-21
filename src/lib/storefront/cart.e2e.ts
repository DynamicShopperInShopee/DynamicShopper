import { expect, test, type Locator } from '@playwright/test';

for (const locale of ['en', 'th'] as const) {
	test(`continues from adding a product to its cart and receipt in ${locale}`, async ({ page }) => {
		const th = locale === 'th';
		await page.setViewportSize(th ? { width: 390, height: 844 } : { width: 1440, height: 900 });
		await page.goto('/');
		if (th) await page.getByRole('button', { name: 'ไทย', exact: true }).click();
		await page.locator('#products [data-product-card] a').first().click();
		await page.getByRole('button', { name: th ? /^เพิ่มลงตะกร้า/ : /^Add to cart/ }).click();
		const view = page.getByRole('button', { name: th ? 'ดูตะกร้า' : 'View cart', exact: true });
		await view.click();
		const title = th ? 'ตะกร้า' : 'Cart';
		const cart = page.getByRole('region', { name: title, exact: true });
		await expect(cart.locator('[data-field="quantity"]')).toHaveAttribute('data-raw', '1');
		await cart.getByRole('button', { name: th ? 'ปิดตะกร้า' : 'Close cart' }).click();
		await expect(cart).toBeHidden();
		await page.getByRole('link', { name: th ? 'กลับหน้าร้าน' : 'Back to store', exact: true }).click();
		await expect(page).toHaveURL((url) => url.pathname === '/');
		await page.reload();
		const homeCart = page.getByRole('button', { name: /^(Cart|ตะกร้า)$/ });
		await homeCart.click();
		const restored = page.getByRole('region', { name: /^(Cart|ตะกร้า)$/ });
		await expect(restored.locator('[data-field="quantity"]')).toHaveAttribute('data-raw', '1');
		await restored
			.getByRole('button', { name: /Best price for my cart|ดูราคาที่ดีที่สุดสำหรับตะกร้า/ })
			.click();
		await expect(page.locator('.quote [data-deal-fact="total"]')).toBeVisible();
	});
}

function receiptLines(root: Locator) {
	return root.locator('[data-deal-fact]').evaluateAll((lines) =>
		lines.map((line) => ({
			field: line.getAttribute('data-deal-fact'),
			raw: line.getAttribute('data-raw'),
			text: line.textContent?.trim()
		}))
	);
}

test('quotes the same cooker from its listing and restored cart, then removes it', async ({
	page
}) => {
	await page.goto('/product/cooker-one-button?view=receipt');
	await page.getByRole('button', { name: 'Best price', exact: true }).click();
	const receipt = page.locator('[data-deal-fact="total"]');
	await expect(receipt).toHaveAttribute('data-raw', '585');
	const itemLines = await receiptLines(page.locator('main'));
	await page.getByRole('button', { name: /^Add to cart/ }).click();
	await expect(page.getByText('Added to cart', { exact: true })).toBeVisible();
	await page.getByRole('link', { name: 'Back to store', exact: true }).click();
	await expect(page).toHaveURL(
		(url) => url.pathname === '/' && url.searchParams.get('view') === 'receipt'
	);
	await page.reload();
	await page.getByRole('button', { name: 'Cart', exact: true }).click();
	let cart = page.getByRole('region', { name: 'Cart', exact: true });
	await expect(cart.locator('[data-field="quantity"]')).toHaveAttribute('data-raw', '1');
	await cart.getByRole('button', { name: 'Best price for my cart' }).click();
	await expect(receipt).toHaveAttribute('data-raw', '585');
	const cartLines = await receiptLines(page.locator('main'));
	// Add-on suggestions can be offered independently of the base receipt.
	expect(cartLines.filter((x) => x.field !== 'extraCost')).toEqual(
		itemLines.filter((x) => x.field !== 'extraCost')
	);
	await page.getByRole('button', { name: 'Close receipt' }).click();
	await page.getByRole('button', { name: 'Cart', exact: true }).click();
	cart = page.getByRole('region', { name: 'Cart', exact: true });
	await cart.getByRole('button', { name: /^Remove / }).click();
	await expect(cart.getByText('Your cart is empty')).toBeVisible();
	await page.reload();
	await page.getByRole('button', { name: 'Cart', exact: true }).click();
	await expect(cart.getByText('Your cart is empty')).toBeVisible();
});

test('restores the saved presentation before applying a shared look as one undo step', async ({
	page
}) => {
	await page.goto('/?view=receipt');
	await page.getByRole('button', { name: 'Shopper views', exact: true }).click();
	await page.getByRole('button', { name: 'Tech minimal', exact: true }).click();
	await page.reload();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'minimal');
	await expect(page.getByText('Restored your saved store')).toBeVisible();
	await page.goto('/?look=large.list.th');
	await expect(page.locator('.store')).toHaveAttribute('lang', 'th');
	await page.getByRole('button', { name: 'ย้อนกลับ', exact: true }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'minimal');
	await expect(page.locator('.store')).toHaveAttribute('lang', 'en');
});

test('a missing Thai listing keeps its requested theme and links to the receipt store', async ({
	page
}) => {
	const response = await page.goto('/product/no-such-product?lang=th&theme=large&view=receipt');
	expect(response?.status()).toBe(404);
	const main = page.getByRole('main');
	await expect(main).toHaveAttribute('lang', 'th');
	await expect(main).toHaveAttribute('data-storefront-theme', 'large-print');
	await expect(main.getByRole('heading', { name: 'ไม่พบสินค้า' })).toBeVisible();
	await main.getByRole('link', { name: 'กลับหน้าร้าน' }).click();
	await page.getByRole('button', { name: 'Shopper views', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Mom mode', exact: true })).toBeVisible();
});
