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

test('Reset releases an explicit default category with one undoable step', async ({ page }) => {
	await page.goto('/?view=receipt');
	const reset = page.getByRole('button', { name: 'Reset store', exact: true });
	const undo = page.getByRole('button', { name: 'Undo', exact: true });
	const all = page.getByRole('button', { name: 'All', exact: true });
	await expect(page.getByRole('button', { name: 'X-ray', exact: true })).toBeEnabled();
	await expect(reset).toBeDisabled();
	await all.click();
	await expect(undo).toBeDisabled();
	await expect(reset).toBeEnabled();
	await reset.click();
	await expect(reset).toBeDisabled();
	await expect(undo).toBeEnabled();
	await undo.click();
	await expect(reset).toBeEnabled();

	const input = page.getByRole('textbox', { name: 'Ask the store' });
	await input.fill('show me rice cookers');
	await input.press('Enter');
	await expect(page.getByRole('log').getByText('Offline mode')).toBeVisible();
	await expect(all).toHaveAttribute('aria-pressed', 'true');
	await reset.click();
	await input.fill('show me rice cookers');
	await input.press('Enter');
	await expect(page.getByRole('button', { name: 'Rice cookers', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
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
