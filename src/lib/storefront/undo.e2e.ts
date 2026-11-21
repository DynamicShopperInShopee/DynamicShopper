import { expect, test } from '@playwright/test';

test('persona and shared-look changes explain themselves and clear on Undo', async ({ page }) => {
	await page.goto('/?view=receipt');
	await page.getByRole('button', { name: 'Tech minimal', exact: true }).click();
	const notice = page
		.getByRole('status')
		.filter({ has: page.getByText('What changed', { exact: true }) });
	await expect(notice).toContainText('Theme');
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(notice).toHaveCount(0);
	await page.goto('/?look=vibrant.grid.en');
	await expect(notice).toContainText('Theme');
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(notice).toHaveCount(0);
});

test('Reset and Undo are disabled at the default state', async ({ page }) => {
	await page.goto('/?view=receipt');
	await expect(page.getByRole('searchbox')).toBeEnabled();
	const undo = page.getByRole('button', { name: 'Undo', exact: true });
	await expect(undo).toBeDisabled();
	await expect(page.getByRole('button', { name: 'Reset store', exact: true })).toBeDisabled();
});

test('submitting the same search again adds no duplicate Undo entry', async ({ page }) => {
	await page.goto('/?view=receipt');
	const search = page.getByRole('searchbox');
	const undo = page.getByRole('button', { name: 'Undo', exact: true });
	await search.fill('rice cooker');
	await search.press('Enter');
	await expect(undo).toBeEnabled();

	await search.fill('  rice cooker  ');
	await search.press('Enter');
	await undo.click();
	await expect(search).toHaveValue('');
	await expect(undo).toBeDisabled();
});

test('Undo after a meaningful reset restores the search and shipping filter', async ({ page }) => {
	await page.goto('/?view=receipt');
	const search = page.getByRole('searchbox');
	await search.fill('rice cooker');
	await search.press('Enter');
	await page.getByRole('button', { name: 'Filters', exact: true }).click();
	const shipping = page.getByRole('checkbox', { name: 'Free shipping only' });
	await shipping.check();
	await page.getByRole('button', { name: 'Apply filters', exact: true }).click();

	await page.getByRole('button', { name: 'Reset store', exact: true }).click();
	await expect(search).toHaveValue('');
	await expect(shipping).not.toBeChecked();
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(search).toHaveValue('rice cooker');
	await expect(shipping).toBeChecked();
});
