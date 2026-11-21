import { expect, test } from '@playwright/test';

test('shows the responding model when it agrees with the shopper, then identifies a real fallback', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await page.getByRole('link', { name: 'Shopping assistant' }).click();
	await page.getByRole('button', { name: 'X-ray' }).click();
	await page.getByRole('button', { name: 'Try live model' }).click();
	const endpoint = '**/api/local-assistant';
	await page.route(endpoint, (route) =>
		route.fulfill({
			json: { model: 'test-model', patch: { theme: 'minimal', density: 'compact' } }
		})
	);
	const input = page.getByRole('textbox', { name: 'Ask the store' });
	const store = page.locator('.store');
	await input.fill('minimal and compact');
	await input.press('Enter');
	await expect(store).toHaveAttribute('data-theme', 'minimal');
	await expect(store).toHaveAttribute('data-density', 'compact');
	await expect(page.getByText('Live model · test-model', { exact: true })).toBeVisible();
	await expect(page.getByText('Used local settings', { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(store).toHaveAttribute('data-theme', 'standard');
	await expect(store).toHaveAttribute('data-density', 'comfortable');

	await page.unroute(endpoint);
	await input.fill('minimal and compact');
	await input.press('Enter');
	await expect(page.getByText('Live model unavailable. Used offline mode.')).toBeVisible();
	await expect(store).toHaveAttribute('data-theme', 'minimal');
	await expect(page.getByText('Live model · test-model', { exact: true })).toHaveCount(0);
});
