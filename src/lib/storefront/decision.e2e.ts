import { test, expect } from '@playwright/test';
import { optimizeDeal } from '../pricing';
import { formatFact, resolveFact } from '../catalog';
for (const width of [390, 1440]) {
	test(`decision modes and cart survive Undo ${width}`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/');
		await page.getByRole('searchbox').fill('rice cooker');
		await page.getByRole('searchbox').press('Enter');
		await page.getByRole('button', { name: 'Filters', exact: true }).click();
		await page.getByRole('spinbutton', { name: 'Maximum price (฿)', exact: true }).fill('1000');
		await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
		await page
			.getByRole('navigation', { name: 'Rice cooker filters' })
			.getByRole('button', { name: '1.8 L', exact: true })
			.click();
		await page.getByRole('button', { name: 'For mum, easy to use', exact: true }).click();
		const panel = page.getByRole('region', { name: 'Decision help' });
		expect(await panel.getByRole('button', { name: /Add to cart/ }).count()).toBeLessThanOrEqual(3);
		await panel
			.getByRole('button', { name: /Add to cart/ })
			.first()
			.click();
		await expect(panel.getByText('Added to cart', { exact: true })).toBeVisible();
		await page.getByRole('button', { name: 'Compare before buying', exact: true }).click();
		await expect(panel.getByRole('table')).toBeVisible();
		await expect(panel.getByRole('columnheader', { name: 'Warranty', exact: true })).toBeVisible();
		await panel
			.getByRole('button', { name: /Add to cart/ })
			.first()
			.click();
		await expect(panel.getByText('Added to cart', { exact: true })).toBeVisible();
		const cartBefore = await page.evaluate(() => localStorage.getItem('dynamicshopper.store.v1'));
		await page.getByRole('button', { name: 'Undo decision view', exact: true }).click();
		expect(await page.evaluate(() => localStorage.getItem('dynamicshopper.store.v1'))).toEqual(
			cartBefore
		);
		await expect(panel.locator('[data-field="price"]')).toHaveCount(2);
		expect(
			await panel
				.locator('[data-field="price"]')
				.evaluateAll((nodes) => nodes.every((n) => Number(n.getAttribute('data-raw')) <= 1000))
		).toBe(true);
		await expect(page.getByRole('region', { name: 'Smart Basket', exact: true })).toHaveCount(0);
		await expect(panel.getByRole('table')).toHaveCount(0);
		await expect(page.getByRole('searchbox')).toHaveValue('rice cooker');
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
	});
	for (const accept of [false, true])
		test(`companion ${accept ? 'accept' : 'decline'} ${width}`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/product/vitamin-c-serum?view=receipt');
			await page.getByRole('button', { name: /^Add to cart/ }).click();
			await expect(page.getByText('Added to cart', { exact: true })).toBeVisible();
			await page.getByRole('link', { name: 'Back to store', exact: true }).click();
			const panel = page.getByRole('region', { name: 'Smart Basket', exact: true });
			await expect(panel).toBeVisible();
			const before = optimizeDeal([{ productId: 'vitamin-c-serum', quantity: 1 }], {
				openedAt: 0,
				now: 0
			})!;
			const after = optimizeDeal(
				[
					{ productId: 'vitamin-c-serum', quantity: 1 },
					{ productId: 'ceramide-moisturiser', quantity: 1 }
				],
				{ openedAt: 0, now: 0 }
			)!;
			await expect(panel.locator('[data-field="total"]')).toHaveAttribute(
				'data-raw',
				String(after.total)
			);
			await expect(panel.locator('[data-field="extraCost"]')).toHaveAttribute(
				'data-raw',
				String(after.total - before.total)
			);
			await panel.getByRole('button', { name: accept ? /Add to cart/ : 'No thanks' }).click();
			await expect(panel).toHaveCount(0);
			const cartButton = page.getByRole('button', {
				name: accept ? 'View cart' : 'Cart',
				exact: true
			});
			await cartButton.click();
			const cart = page.getByRole('region', { name: 'Cart', exact: true });
			await expect(cart.getByRole('button', { name: /Remove Ceramide/ })).toHaveCount(
				accept ? 1 : 0
			);
		});
}

test('easy-use preserves eligible cookers and explains a selection with no simple model', async ({
	page
}) => {
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
	const search = page.getByRole('searchbox');
	await search.fill('rice cooker');
	await search.press('Enter');
	const volume = formatFact(resolveFact('cooker-digital', 'spec.capacity')!, 'en');
	await page
		.getByRole('navigation', { name: 'Rice cooker filters' })
		.getByRole('button', { name: volume, exact: true })
		.click();
	const cards = page.locator('#products .product-grid [data-product]');
	const before = await cards.evaluateAll((nodes) =>
		nodes.map((node) => node.getAttribute('data-product'))
	);
	expect(before).toContain('cooker-digital');
	await page.getByRole('button', { name: 'For mum, easy to use' }).click();
	await expect(page.getByRole('region', { name: 'Decision help' })).toContainText(
		'No simple models match'
	);
	expect(
		await cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-product')))
	).toEqual(before);
});

test('easy-use suggestions preserve the shopper’s explicit price order and Thai basket label', async ({
	page
}) => {
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
	const search = page.getByRole('searchbox');
	await search.fill('rice cooker');
	await search.press('Enter');
	await page.getByRole('combobox', { name: 'Sort by', exact: true }).selectOption('price-high');
	const ids = () =>
		page
			.locator('#products .product-grid [data-product]')
			.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-product')));
	const original = await ids();
	expect(original.length).toBeGreaterThan(3);
	await page.getByRole('button', { name: 'For mum, easy to use' }).click();
	expect(await ids()).toEqual(original);

	await page.goto('/product/vitamin-c-serum');
	await page
		.getByRole('button', { name: /Add to cart/ })
		.first()
		.click();
	await expect(page.getByText('Added to cart', { exact: true })).toBeVisible();
	await page.goto('/');
	await page.getByRole('button', { name: 'ไทย', exact: true }).click();
	await expect(
		page.getByRole('region', { name: 'ตะกร้าแนะนำ' }).getByRole('heading', { name: 'ตะกร้าแนะนำ' })
	).toBeVisible();
});

test('listing navigation restores the chosen decision view and its Undo', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	await page.getByRole('button', { name: 'For mum, easy to use' }).click();
	await page.getByRole('button', { name: 'Compare before buying' }).click();
	const panel = page.getByRole('region', { name: 'Decision help' });
	await panel.getByRole('link').first().click();
	await page.getByRole('link', { name: /Back to (store|results)/ }).click();
	await expect(panel.getByRole('table')).toBeVisible();
	await page.getByRole('button', { name: 'Undo decision view' }).click();
	await expect(panel).toContainText('fewer programs');
});
