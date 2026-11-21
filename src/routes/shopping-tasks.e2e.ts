import { expect, test } from '@playwright/test';

test('compares chosen catalog products and checks a deal offline without reordering results', async ({
	page,
	context
}) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	await context.setOffline(true);
	const shelfIds = () =>
		page
			.locator('#products [data-product]')
			.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-product')));
	const before = await shelfIds();
	await page.getByRole('button', { name: 'Compare products', exact: true }).click();
	const dialog = page.getByRole('dialog');
	await dialog.getByLabel('First product').selectOption('cooker-one-button');
	await dialog.getByLabel('Second product').selectOption({ index: 2 });
	await expect(
		dialog.getByRole('table').locator('[data-product-id="cooker-one-button"][data-fact="price"]')
	).toHaveAttribute('data-raw', '690');
	await dialog.getByLabel('Shipping').uncheck();
	await expect(dialog.getByRole('table').locator('[data-fact="shipping"]')).toHaveCount(0);
	await page.keyboard.press('Escape');
	await expect(page.getByRole('button', { name: 'Compare products', exact: true })).toBeFocused();
	await page.getByRole('button', { name: 'Calculate a deal', exact: true }).click();
	await expect(dialog.locator('[data-deal-fact="total"]')).toHaveCount(0);
	await dialog.getByLabel('Choose a product').selectOption('cooker-one-button');
	await expect(dialog.locator('[data-deal-fact="total"]')).toHaveAttribute('data-raw', '585');
	await page.keyboard.press('Escape');
	expect(await shelfIds()).toEqual(before);
	await page.getByRole('combobox', { name: 'Categories', exact: true }).selectOption('earbuds');
	await page.getByRole('button', { name: 'Compare products', exact: true }).click();
	await expect(dialog.getByText('Outside current results', { exact: true })).toHaveCount(2);
});

for (const entry of ['/', '/?view=receipt']) {
	test(`withdraws task proof on ${entry} when a comparison fact or picker name changes`, async ({
		page,
		context
	}) => {
		await page.goto(entry);
		await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
		await context.setOffline(true);
		const compare = page.getByRole('button', { name: 'Compare products', exact: true });
		const dialog = page.getByRole('dialog');
		await compare.click();
		await dialog.getByLabel('First product').selectOption('cooker-one-button');
		await dialog.getByLabel('Second product').selectOption('cooker-digital');
		const price = dialog.locator('[data-product-id="cooker-one-button"][data-fact="price"]');
		await expect(price).toHaveText('฿690');
		await price.evaluate((node) => (node.textContent = '฿1'));
		await expect(dialog.getByText('Displayed facts differ from the catalog')).toBeVisible();
		await price.evaluate((node) => (node.textContent = '฿690'));
		await expect(dialog.getByText('Facts verified', { exact: true })).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(compare).toBeFocused();

		await page.getByRole('button', { name: 'Calculate a deal', exact: true }).click();
		const picker = dialog.getByLabel('Choose a product');
		await picker.selectOption('cooker-one-button');
		const total = dialog.locator('[data-deal-fact="total"]');
		await expect(total).toHaveAttribute('data-raw', '585');
		await expect(dialog.getByText('Facts verified', { exact: true })).toBeVisible();
		await picker.locator('option[value="cooker-one-button"]').evaluate((node) => {
			node.textContent = 'Unrecognized product';
		});
		await expect(dialog.getByText('Displayed facts differ from the catalog')).toBeVisible();
		await expect(total).toHaveAttribute('data-raw', '585');
	});
}
