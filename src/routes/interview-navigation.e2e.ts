import { expect, test } from '@playwright/test';

for (const method of ['browser Back', 'listing Back', 'listing Search']) {
	test(`the applied interview and Undo survive ${method}`, async ({ page, context }) => {
		await page.goto('/');
		await expect(page.getByRole('button', { name: 'Start a quick interview' })).toBeEnabled();
		await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
		await page.getByRole('button', { name: '1.8 L', exact: true }).click();
		await page.getByRole('button', { name: 'Start a quick interview' }).click();
		const dialog = page.getByRole('dialog');
		await dialog.getByRole('radio', { name: 'Compare', exact: true }).check();
		await dialog.getByRole('button', { name: 'Next', exact: true }).click();
		for (let step = 0; step < 3; step++) await dialog.getByRole('button', { name: /Skip/ }).click();

		const table = page.getByRole('region', { name: 'Product table' });
		await table.getByRole('link').first().click();
		await expect(page.getByRole('link', { name: 'Back to store' })).toBeVisible();
		expect(await page.evaluate(() => JSON.stringify(history.state))).not.toMatch(
			/interviewAnswers|interviewDirectOnly|priorities|undoStack/
		);
		await context.setOffline(true);
		if (method === 'browser Back') await page.goBack();
		else
			await page
				.getByRole('link', {
					name: method === 'listing Back' ? 'Back to store' : 'Search products'
				})
				.click();
		await expect(page).toHaveURL(/\/$/);
		await expect(table.locator('tbody tr')).toHaveCount(2);
		await expect(page.getByRole('button', { name: 'Edit my answers' })).toBeVisible();
		await page.getByRole('button', { name: 'Undo', exact: true }).click();
		await expect(page.getByRole('button', { name: 'Start a quick interview' })).toBeVisible();
		await expect(page.getByRole('button', { name: '1.8 L', exact: true })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});
}
