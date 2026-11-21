import { expect, test } from '@playwright/test';

test('Undo after the empty-state reset restores the unsuccessful search and filters', async ({
	page
}) => {
	await page.goto('/?view=receipt');
	const search = page.getByRole('searchbox');
	await expect(search).toBeEnabled();
	await search.fill('unmatched-synthetic-product');
	await search.press('Enter');
	await page.getByRole('button', { name: 'Filters', exact: true }).click();
	await page
		.locator('#search-filters')
		.getByRole('checkbox', { name: 'Free shipping only' })
		.check();
	await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
	await page.locator('.empty').getByRole('button').click();
	await expect(search).toHaveValue('');
	await expect(page.locator('.empty')).toHaveCount(0);
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(search).toHaveValue('unmatched-synthetic-product');
	await expect(page.getByRole('button', { name: 'Free shipping only', exact: true })).toBeVisible();
	await expect(page.locator('.empty')).toBeVisible();
});

for (const draft of ['', 'unsubmitted draft']) {
	test(`resetting the default public shelf with draft '${draft}' does not create an Undo step`, async ({
		page
	}) => {
		await page.goto('/');
		await expect(page.getByRole('searchbox')).toBeEnabled();
		await page.getByRole('searchbox').fill(draft);
		await page.getByRole('button', { name: 'Reset search', exact: true }).click();
		await page.getByRole('link', { name: 'Shopping assistant', exact: true }).click();
		await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
	});
}
