import { expect, test } from '@playwright/test';

for (const action of ['Clear filters', 'chip']) {
	test(`Undo restores an applied shipping filter after ${action}`, async ({ page }) => {
		await page.goto('/?view=receipt');
		await expect(page.getByRole('searchbox')).toBeEnabled();
		await page.getByRole('button', { name: 'Filters', exact: true }).click();
		const filters = page.locator('#search-filters');
		await filters.getByRole('checkbox', { name: 'Free shipping only' }).check();
		await filters.getByRole('button', { name: 'Apply filters', exact: true }).click();
		const chip = page.getByRole('button', { name: 'Free shipping only', exact: true });
		await expect(chip).toBeVisible();
		if (action === 'chip') await chip.click();
		else {
			await filters.getByRole('button', { name: 'Clear filters', exact: true }).click();
			// Clearing an already clear shelf must not add a second checkpoint.
			await filters.getByRole('button', { name: 'Clear filters', exact: true }).click();
		}
		await expect(chip).toHaveCount(0);
		await page.getByRole('button', { name: 'Undo', exact: true }).click();
		await expect(chip).toBeVisible();
		await expect(filters.getByRole('checkbox', { name: 'Free shipping only' })).toBeChecked();
	});
}

test('removing a budget chip can be undone without losing its applied amount', async ({ page }) => {
	await page.goto('/?view=receipt');
	await expect(page.getByRole('searchbox')).toBeEnabled();
	await page.getByRole('button', { name: 'Filters', exact: true }).click();
	const filters = page.locator('#search-filters');
	await filters.getByRole('spinbutton').fill('1500');
	await filters.getByRole('button', { name: 'Apply filters', exact: true }).click();
	const chip = page.locator('.chips').getByRole('button', { name: /Maximum price.*1,500/ });
	await chip.click();
	await expect(chip).toHaveCount(0);
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(chip).toBeVisible();
});
