import { expect, test } from '@playwright/test';

test('Reset store at the default state leaves Undo unavailable', async ({ page }) => {
	await page.goto('/?view=receipt');
	await expect(page.getByRole('searchbox')).toBeEnabled();
	const undo = page.getByRole('button', { name: 'Undo', exact: true });
	await expect(undo).toBeDisabled();
	await page.getByRole('button', { name: 'Reset store', exact: true }).click();
	await expect(undo).toBeDisabled();
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
