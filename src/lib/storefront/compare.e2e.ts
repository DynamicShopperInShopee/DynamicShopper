import { expect, test } from '@playwright/test';

test('uses the matched category for tech specifications without changing the search filters', async ({
	page
}) => {
	await page.goto('/compare?q=gaming+mouse');
	const left = page.getByRole('region', { name: 'Left view' });
	await expect(left.getByRole('columnheader', { name: 'Max DPI' })).toBeVisible();
	await expect(left.getByRole('columnheader', { name: 'Battery life' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'All', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);

	await page.getByRole('searchbox').fill('');
	await expect(left.getByRole('columnheader', { name: 'Max DPI' })).toHaveCount(0);
});

for (const comparison of ['inline', 'page'] as const) {
	test(`keeps the selected cooker capacity and shipping in the ${comparison} comparison`, async ({
		page,
		context
	}) => {
		await page.goto('/');
		await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
		await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
		const strip = page.getByRole('navigation', { name: 'Rice cooker filters' });
		await strip.getByRole('button', { name: '1.8 L', exact: true }).click();
		await strip.getByRole('button', { name: 'Free shipping', exact: true }).click();
		await strip.getByRole('link', { name: 'Shopping assistant' }).click();
		await expect(page.locator('.compare-link')).toHaveAttribute('data-offline-ready', 'true');
		await expect(page.locator('#products [data-fact="resultCount"]')).toHaveText('0');
		await context.setOffline(true);
		if (comparison === 'inline') {
			await page.getByRole('button', { name: 'Compare views', exact: true }).click();
			await expect(page.locator('[data-compare-pane]')).toHaveCount(2);
			await expect(page.locator('[data-compare-pane] [data-fact="name"]')).toHaveCount(0);
		} else {
			await page.getByRole('link', { name: 'Compare views', exact: true }).click();
			await expect(page).toHaveURL(/\/compare/);
			const left = page.getByRole('region', { name: 'Left view' });
			const right = page.getByRole('region', { name: 'Right view' });
			await expect(left).toBeVisible();
			await expect(right).toBeVisible();
			await expect(left.locator('[data-field="name"]')).toHaveCount(0);
			await expect(right.locator('[data-field="name"]')).toHaveCount(0);
		}
	});
}
