import { expect, test } from '@playwright/test';

test('shows the responding model when it agrees with the shopper, then identifies a real fallback', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await page.getByRole('link', { name: 'Shopping assistant' }).click();
	const showChat = page.getByRole('button', { name: 'Chat with the assistant', exact: true });
	const closeChat = page.getByRole('button', { name: 'Close chat', exact: true });
	const showTrace = page.getByRole('button', { name: 'X-ray', exact: true });
	const trace = page.getByRole('dialog', { name: 'X-ray' });
	const closeTrace = trace.getByRole('button', { name: 'Close X-ray' });
	await closeChat.click();
	await showTrace.click();
	await trace.getByRole('button', { name: 'Try live model' }).click();
	await closeTrace.click();
	await showChat.click();
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
	await expect(
		page.getByRole('log').getByText('Used local settings', { exact: true })
	).toBeVisible();
	await closeChat.click();
	await showTrace.click();
	await expect(trace.getByText('test-model', { exact: true })).toBeVisible();
	await closeTrace.click();
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(store).toHaveAttribute('data-theme', 'standard');
	await expect(store).toHaveAttribute('data-density', 'comfortable');

	await page.unroute(endpoint);
	await showChat.click();
	await input.fill('minimal and compact');
	await input.press('Enter');
	await expect(page.getByRole('log').getByText('Offline mode', { exact: true })).toBeVisible();
	await closeChat.click();
	await showTrace.click();
	await expect(trace.getByText('Live model unavailable. Used offline mode.')).toBeVisible();
	await expect(store).toHaveAttribute('data-theme', 'minimal');
	await expect(trace).not.toContainText('test-model');
});
