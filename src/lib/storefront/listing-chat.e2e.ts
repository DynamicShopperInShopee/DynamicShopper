import { expect, test } from '@playwright/test';

test('answers about the open product offline and quotes its cart quantity', async ({
	page,
	context
}) => {
	await page.goto('/product/cooker-one-button?lang=en&theme=minimal&view=receipt');
	const chat = page.getByRole('complementary', { name: 'Chat with the assistant' });
	await expect(chat).toBeVisible();
	const input = chat.getByRole('textbox', { name: 'Ask the store' });
	await expect(input).toBeEnabled();
	await context.setOffline(true);
	await input.fill('What is the capacity?');
	await input.press('Enter');
	const log = chat.getByRole('log');
	await expect(log.getByRole('link', { name: '1.8 L', exact: true })).toHaveAttribute(
		'href',
		/\/product\/cooker-one-button\?.*view=receipt/
	);
	await expect(page.locator('main')).toHaveAttribute('data-theme', 'minimal');
	const add = page.getByRole('button', { name: /^Add to cart/ });
	await add.click();
	await expect(page.getByText('Added to cart', { exact: true })).toBeVisible();
	await page.evaluate(
		() =>
			new Promise<void>((ready) => {
				void navigator.locks.request(
					'dynamicshopper.store.v1',
					() =>
						new Promise<void>((release) => {
							window.addEventListener('release-cart-write', () => release(), { once: true });
							ready();
						})
				);
			})
	);
	await add.click();
	await expect(add).toBeDisabled();
	await input.fill('cheapest way to get this?');
	await input.press('Enter');
	await expect(log.locator('[data-deal-fact="quantity"]')).toHaveCount(0);
	await page.evaluate(() => window.dispatchEvent(new Event('release-cart-write')));
	await expect(log.locator('[data-deal-fact="quantity"]')).toHaveAttribute('data-raw', '2');
	await page.getByRole('button', { name: 'Best price', exact: true }).click();
	const actual = await page
		.locator('main .quote [data-deal-fact="total"]')
		.getAttribute('data-raw');
	await expect(log.locator('[data-deal-fact="total"]')).toHaveAttribute('data-raw', actual!);
});

test('uses the storefront undo stack once for a change requested on a listing', async ({
	page
}) => {
	await page.goto('/product/cooker-one-button?view=receipt');
	const input = page.getByRole('textbox', { name: 'Ask the store' });
	await input.fill('minimal and compact');
	await input.press('Enter');
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'minimal');
	await expect(page.getByRole('log').getByText('minimal and compact', { exact: true })).toHaveCount(
		1
	);
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'standard');
});

test.describe('before listing hydration', () => {
	test.use({ javaScriptEnabled: false });
	test('keeps native links available and the script-controlled specifications sheet disabled', async ({
		page
	}) => {
		await page.goto('/product/cooker-one-button?view=receipt');
		await expect(page.getByRole('button', { name: 'Specifications', exact: true })).toBeDisabled();
		await expect(page.getByRole('link', { name: 'Back to store', exact: true })).toBeVisible();
	});
});
