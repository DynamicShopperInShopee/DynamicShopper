import { expect, test } from '@playwright/test';

test('a cooker capacity follows the shopper into the offline assistant and is reversible', async ({
	page,
	context
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	await page.getByRole('button', { name: '1.8 L', exact: true }).click();
	const count = page.locator('#products [data-fact="resultCount"]');
	await expect(count).toHaveText('2');
	await page.getByRole('link', { name: 'Shopping assistant' }).press('Enter');
	await expect(page.getByRole('textbox', { name: 'Ask the store' })).toBeVisible();
	await page.keyboard.press('Escape');
	await context.setOffline(true);
	await expect(count).toHaveText('2');
	const capacity = page.getByRole('button', { name: 'Capacity 1.8 L' });
	await expect(capacity).toBeVisible();
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	await expect(capacity).toBeVisible();

	await page.getByRole('button', { name: 'Chat with the assistant' }).click();
	await page.getByRole('textbox', { name: 'Ask the store' }).fill('ขอแบบเรียบๆ ดูสเปกก่อน');
	await page.getByRole('button', { name: 'Send' }).click();
	await page.keyboard.press('Escape');
	const rows = page.locator('#products tbody tr');
	await expect(rows).toHaveCount(2);
	await expect(rows.locator('[data-fact="spec.capacity"]')).toHaveText(['1.8 L', '1.8 L']);
	await page.getByRole('button', { name: 'Compare views' }).click();
	const panes = page.locator('[data-compare-pane]');
	await expect(panes).toHaveCount(2);
	for (const pane of await panes.all()) {
		await expect(pane.locator('[data-product]')).toHaveCount(2);
	}
	await capacity.click();
	await expect(count).toHaveText('6');
	await page.getByRole('button', { name: 'Undo' }).click();
	await expect(rows).toHaveCount(2);
	await page.getByRole('button', { name: 'Reset store' }).click();
	await expect(capacity).toHaveCount(0);
	await expect(count).toHaveText('33');
	await page.getByRole('button', { name: 'Undo' }).click();
	await expect(rows).toHaveCount(2);
	await expect(capacity).toBeVisible();
});

for (const control of ['category tab', 'assistant']) {
	test(`a new category in the ${control} clears a capacity selected from cooker search results`, async ({
		page
	}) => {
		await page.goto('/');
		await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
		const search = page.getByRole('searchbox');
		await search.fill('rice cooker');
		await search.press('Enter');
		await page.getByRole('button', { name: '1 L', exact: true }).click();
		await page.getByRole('link', { name: 'Shopping assistant' }).click();
		if (control === 'category tab') {
			await page.getByRole('button', { name: 'Capacity 1 L' }).click();
			await page.getByRole('button', { name: 'Earbuds', exact: true }).click();
		} else {
			await page.getByRole('textbox', { name: 'Ask the store' }).fill('Show me earbuds');
			await page.getByRole('button', { name: 'Send' }).click();
			await expect(page.getByText('Capacity filter removed', { exact: true })).toBeVisible();
		}
		await expect(page.locator('#products [data-fact="resultCount"]')).toHaveText('7');
		await expect(search).toHaveValue('');
		await expect(page.getByRole('button', { name: 'Capacity 1 L' })).toHaveCount(0);
		await page.getByRole('button', { name: 'Undo', exact: true }).click();
		await expect(search).toHaveValue('rice cooker');
		if (control === 'assistant') {
			await expect(page.getByRole('button', { name: 'Capacity 1 L' })).toBeVisible();
		}
	});
}
