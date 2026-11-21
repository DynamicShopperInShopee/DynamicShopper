import { expect, test } from '@playwright/test';

test('the module review exposes service dependencies and recoverable error states', async ({
	page
}) => {
	await page.goto('/presets');
	await page.getByRole('button', { name: 'English', exact: true }).click();
	await expect(page.locator('.count strong')).toHaveText('177');
	await expect(
		page.getByRole('navigation', { name: 'Website parts' }).getByRole('button')
	).toHaveCount(12);
	await page.getByRole('combobox', { name: 'Data state', exact: true }).selectOption('error');
	await expect(page.getByRole('alert')).toContainText('unavailable');
	await page.getByRole('button', { name: 'Try again', exact: true }).click();
	await expect(page.getByRole('alert')).toHaveCount(0);
});

test('presentation examples remain isolated from the store', async ({ page }) => {
	await page.goto('/');
	await page.goto('/presets');
	await page.getByRole('button', { name: 'English', exact: true }).click();
	await page
		.getByRole('combobox', { name: 'Example', exact: true })
		.selectOption({ label: 'Large-print comparison' });
	await expect(page.getByRole('button', { name: /Apply/ })).toHaveCount(0);
	await page.getByRole('link', { name: 'Back to the store', exact: true }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'standard');
	await expect(page.locator('#products table')).toHaveCount(0);
});

test('examples use ranked choices and retain language and large print in listing links', async ({
	page
}) => {
	await page.goto('/presets');
	await page.getByRole('button', { name: 'English', exact: true }).click();
	await page
		.getByRole('combobox', { name: 'Example', exact: true })
		.selectOption({ label: 'Large-print comparison' });
	const links = page.locator('.example-shelf a[href*="/product/"]');
	await expect(links.first()).toHaveAttribute('href', /lang=en&theme=large/);
	await expect(links.first()).toHaveAttribute('href', /cooker-ih/);
});
