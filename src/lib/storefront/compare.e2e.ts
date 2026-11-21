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
