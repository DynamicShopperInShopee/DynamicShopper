import { expect, test } from '@playwright/test';

test('shares only the canonical listing and safe display parameters', async ({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
		Object.defineProperty(navigator, 'clipboard', {
			value: {
				writeText: async (value: string) => {
					document.documentElement.dataset.copiedLink = value;
				}
			},
			configurable: true
		});
	});
	await page.goto(
		'/product/cooker-1?lang=th&theme=large&view=receipt&look=large.grid.th&token=private#reviews'
	);
	await page.getByRole('button', { name: 'แชร์สินค้า', exact: true }).click();
	const expected = new URL('/product/cooker-one-button?lang=th&theme=large', page.url()).href;
	await expect(page.locator('html')).toHaveAttribute('data-copied-link', expected);
	await expect(page.getByRole('status')).toHaveText('คัดลอกลิงก์แล้ว');
});

test('offers a selectable link when sharing and clipboard are unavailable', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
		Object.defineProperty(navigator, 'clipboard', {
			value: {
				writeText: async () => {
					throw new Error('blocked');
				}
			},
			configurable: true
		});
	});
	await page.goto('/product/cooker-one-button');
	await page.getByRole('link', { name: 'Details', exact: true }).click();
	const share = page.getByRole('button', { name: 'Share', exact: true });
	await expect(share).toBeInViewport();
	await share.click();
	const dialog = page.getByRole('dialog', { name: 'Share product link' });
	const input = dialog.getByLabel('Select the link to copy it');
	await expect(input).toHaveValue(
		new URL('/product/cooker-one-button?lang=en&theme=standard', page.url()).href
	);
	await expect(input).toBeFocused();
	await dialog.getByRole('button', { name: 'Done' }).click();
	await expect(share).toBeFocused();
});

test('native share cancellation does not copy or open another sharing surface', async ({
	page
}) => {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'share', {
			value: async () => {
				throw new DOMException('Canceled', 'AbortError');
			},
			configurable: true
		});
		Object.defineProperty(navigator, 'clipboard', {
			value: {
				writeText: async () => {
					document.documentElement.dataset.unexpectedCopy = 'true';
				}
			},
			configurable: true
		});
	});
	await page.goto('/product/cooker-1');
	const share = page.getByRole('button', { name: 'Share product', exact: true });
	await share.click();
	await expect(share).toHaveAttribute('aria-busy', 'false');
	await expect(page.locator('html')).not.toHaveAttribute('data-unexpected-copy');
	await expect(page.getByRole('dialog', { name: 'Share product link' })).toBeHidden();
});

test('pending native sharing cannot copy the old listing after navigation', async ({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'share', {
			value: () =>
				new Promise((_resolve, reject) => {
					window.addEventListener('reject-share', () => reject(new Error('native failure')), {
						once: true
					});
				}),
			configurable: true
		});
		Object.defineProperty(navigator, 'clipboard', {
			value: {
				writeText: async () => {
					document.documentElement.dataset.unexpectedCopy = 'true';
				}
			},
			configurable: true
		});
	});
	await page.goto('/product/cooker-1');
	await page.getByRole('button', { name: 'Share product', exact: true }).click();
	await page.getByRole('link', { name: 'ไทย', exact: true }).click();
	await expect(page.locator('main')).toHaveAttribute('lang', 'th');
	await page.evaluate(() => window.dispatchEvent(new Event('reject-share')));
	await expect(page.locator('html')).not.toHaveAttribute('data-unexpected-copy');
	await expect(page.getByRole('dialog', { name: 'แชร์ลิงก์สินค้า' })).toBeHidden();
});
