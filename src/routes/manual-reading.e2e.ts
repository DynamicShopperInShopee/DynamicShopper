import { expect, test } from '@playwright/test';

test('editing reading preferences exits large text and Undo restores it', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	async function complete(reading: string, editing = false) {
		await page
			.getByRole('button', {
				name: editing ? 'Edit my answers' : 'Start a quick interview',
				exact: true
			})
			.click();
		const dialog = page.getByRole('dialog');
		for (let i = 0; i < 3; i++) await dialog.getByRole('button', { name: /Skip/ }).click();
		await dialog.getByRole('radio', { name: reading, exact: true }).check();
		// Support the currently merged preview gate and the separate automatic-completion PR.
		await dialog.getByRole('button', { name: /Preview my view|Finish interview/ }).click();
		const apply = dialog.getByRole('button', { name: 'Apply my view', exact: true });
		if (await apply.count()) await apply.click();
		await expect(dialog).toHaveCount(0);
	}
	await complete('Large text');
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'large');
	await complete('Compact', true);
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'standard');
	await expect(page.locator('.store')).toHaveAttribute('data-density', 'compact');
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'large');
	await expect(page.locator('.store')).toHaveAttribute('data-density', 'spacious');
});
