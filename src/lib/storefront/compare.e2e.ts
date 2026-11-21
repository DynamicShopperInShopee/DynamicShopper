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

test('rejects a Thai price relabelled inside the English comparison pane', async ({ page }) => {
	await page.goto('/compare?q=rice+cooker&category=rice-cooker');
	const proof = page.locator('[data-proof="passed"]');
	await expect(proof).toBeVisible();
	const left = page.getByRole('region', { name: 'Left view' });
	const price = left.locator('[data-product="cooker-one-button"][data-field="price"]');
	await expect(price).toHaveText('฿690');
	await price.evaluate((node) => {
		node.setAttribute('lang', 'th');
		node.textContent = '690 บาท';
	});
	await expect(page.getByText(/Left view.*Incorrect printed value/)).toBeVisible();
	await expect(proof).toHaveCount(0);
});
