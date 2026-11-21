import { expect, test } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';

let server: ViteDevServer;
let storefrontUrl: string;

test.beforeAll(async () => {
	server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
	await server.listen();
	const address = server.httpServer?.address();
	if (!address || typeof address === 'string') throw new Error('Missing development server port');
	storefrontUrl = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
	await server?.close();
});

test('applying shipping filters supersedes a delayed model response', async ({ page }) => {
	await page.addInitScript(() => {
		const originalFetch = window.fetch.bind(window);
		window.fetch = (input, init) => {
			const url = input instanceof Request ? input.url : input.toString();
			if (!url.endsWith('/api/local-assistant')) return originalFetch(input, init);
			return new Promise<Response>((resolve) => {
				window.addEventListener(
					'release-test-response',
					() => {
						resolve(Response.json({ model: 'test-model', patch: { theme: 'vibrant' } }));
					},
					{ once: true }
				);
			});
		};
	});
	await page.goto(storefrontUrl + '/?view=receipt');
	await page.getByRole('button', { name: 'X-ray' }).click();
	await page.getByRole('button', { name: 'Try live model' }).click();
	await page.getByRole('textbox', { name: 'Ask the store' }).fill('playful');
	await page.getByRole('button', { name: 'Send' }).click();
	const pending = page.locator('#products').getByText('Reshaping the store…');
	await expect(pending).toBeVisible();
	await page.getByRole('button', { name: 'Filters', exact: true }).click();
	await page.getByRole('checkbox', { name: 'Free shipping only' }).check();
	await page.getByRole('button', { name: 'Apply filters' }).click();
	await page.evaluate(() => window.dispatchEvent(new Event('release-test-response')));
	await expect(pending).toHaveCount(0);
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'standard');
	await expect(page.getByRole('checkbox', { name: 'Free shipping only' })).toBeChecked();
});

test('compares one catalog search in two personas and opens the Thai listing', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(storefrontUrl + '/compare?q=rice+cooker&category=rice-cooker');
	await expect(page.getByRole('searchbox')).toHaveValue('rice cooker');
	const left = page.getByRole('region', { name: 'Left view', exact: true });
	const right = page.getByRole('region', { name: 'Right view', exact: true });
	await expect(right.getByRole('combobox')).toHaveValue('visual');
	await expect(left.getByRole('heading', { name: 'What matters' })).toBeVisible();
	await expect(right.getByRole('heading', { name: 'What buyers say' })).toBeVisible();
	await expect(right.locator('[data-field="voucher.code"]').first()).toBeVisible();
	await right.getByRole('combobox').selectOption('mom');
	const anchor = '[data-product="cooker-one-button"][data-field="price"]';
	await expect(left.locator(anchor)).toHaveText('฿690');
	await expect(right.locator(anchor)).toHaveText('690 บาท');
	await expect(right.locator(anchor)).toHaveAttribute('data-raw', '690');
	await expect(right.locator('[data-field="price"]')).toHaveCount(3);
	await expect(page.locator('[data-proof="passed"]')).toHaveAttribute('data-raw', '9');
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
		true
	);
	await page.getByRole('button', { name: 'Earbuds', exact: true }).click();
	await expect(page.getByText('No shared facts to check yet')).toBeVisible();
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	await expect(page.locator('[data-proof="passed"]')).toBeVisible();
	await page.getByRole('searchbox').fill('no matching cooker');
	await expect(page.getByText('No shared facts to check yet')).toBeVisible();
	await expect(page.locator('[data-proof="passed"]')).toHaveCount(0);
	await page.getByRole('searchbox').fill('one-button');
	await right
		.getByRole('link')
		.filter({ has: page.locator('[data-product="cooker-one-button"]') })
		.click();
	await expect(page.locator('main')).toHaveAttribute('lang', 'th');
	await expect(page.locator('main')).toHaveAttribute('data-theme', 'large');
	await page.goBack();
	await expect(page.getByRole('searchbox')).toHaveValue('one-button');
	await expect(right.getByRole('combobox')).toHaveValue('mom');
	await expect(right.locator(anchor)).toHaveText('690 บาท');
});

test('returns from compare with the original search and undo history', async ({ page }) => {
	await page.goto(storefrontUrl + '/?view=receipt');
	await page.getByRole('searchbox').fill('rice cooker');
	await page.getByRole('button', { name: 'Search', exact: true }).click();
	await page.getByRole('link', { name: 'Compare views', exact: true }).click();
	await expect(page.getByRole('searchbox')).toHaveValue('rice cooker');
	await page.getByRole('searchbox').fill('earbuds');
	await page.getByRole('link', { name: 'Back to the store' }).click();
	await expect(page.getByRole('searchbox')).toHaveValue('rice cooker');
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.getByRole('searchbox')).toHaveValue('');
});

test('opens the comparison offline after the storefront is ready', async ({ page, context }) => {
	await page.goto(storefrontUrl + '/?view=receipt');
	await expect(page.getByRole('link', { name: 'Compare views', exact: true })).toHaveAttribute(
		'data-offline-ready',
		'true'
	);
	await context.setOffline(true);
	await page.getByRole('link', { name: 'Compare views', exact: true }).click();
	await expect(page.locator('[data-proof="passed"]')).toBeVisible();
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	await page
		.getByRole('region', { name: 'Right view', exact: true })
		.getByRole('combobox')
		.selectOption('mom');
	await expect(page.locator('[data-proof="passed"]')).toHaveAttribute('data-raw', '9');
	await page
		.getByRole('region', { name: 'Right view', exact: true })
		.getByRole('link')
		.filter({ has: page.locator('[data-product="cooker-one-button"]') })
		.click();
	await expect(page.locator('main')).toHaveAttribute('data-product', 'cooker-one-button');
	await expect(page.locator('main')).toHaveAttribute('lang', 'th');
	await page.getByRole('link', { name: 'กลับหน้าร้าน' }).click();
	await expect(page).toHaveURL(/\?view=receipt$/);
});

test('keeps the completed offline fallback explanation after returning from compare', async ({
	page
}) => {
	await page.route('**/api/local-assistant', (route) => route.abort());
	await page.goto(storefrontUrl + '/?view=receipt');
	await page.getByRole('button', { name: 'X-ray' }).click();
	await page.getByRole('button', { name: 'Try live model' }).click();
	await page.getByRole('textbox', { name: 'Ask the store' }).fill('playful');
	await page.getByRole('button', { name: 'Send' }).click();
	const reason = page.getByText('Live model unavailable. Used offline mode.');
	await expect(reason).toBeVisible();
	await page.getByRole('link', { name: 'Compare views', exact: true }).click();
	await page.getByRole('link', { name: 'Back to the store' }).click();
	await page.getByRole('button', { name: 'X-ray' }).click();
	await expect(reason).toBeVisible();
	await expect(page.getByRole('button', { name: 'Try live model' })).toBeVisible();
});

for (const layout of ['grid', 'table'] as const) {
	test(`disables ${layout} and cart quotes during a live reshape, while explicit choices remain enabled`, async ({
		page
	}) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(storefrontUrl + '/?view=receipt');
		await page.getByRole('button', { name: 'X-ray', exact: true }).click();
		const live = page.getByRole('button', { name: 'Try live model' });
		await live.click();
		await page.getByRole('button', { name: 'Close X-ray' }).click();
		if (layout === 'table') {
			await page.getByRole('button', { name: 'Tech minimal', exact: true }).click();
		}
		await page
			.getByRole('button', { name: /^Add to cart/ })
			.first()
			.click();
		await expect(page.getByText('Added to cart', { exact: true })).toBeVisible();

		const { promise, resolve } = Promise.withResolvers<void>();
		const settled = Promise.withResolvers<void>();
		await page.route('**/api/local-assistant', async (route) => {
			await promise;
			await route
				.fulfill({ json: { model: 'test-model', patch: { theme: 'vibrant' } } })
				.catch(() => {})
				.finally(settled.resolve);
		});
		const request = page.waitForRequest('**/api/local-assistant');
		const input = page.getByRole('textbox', { name: 'Ask the store' });
		await input.fill('show me a playful store');
		await input.press('Enter');
		await request;
		const quotes = page
			.locator('#products')
			.getByRole('button', { name: 'Best price', exact: true });
		try {
			await expect(quotes.first()).toBeDisabled();
			await expect(
				page.locator('#products').getByRole('status').filter({ hasText: 'Reshaping the store' })
			).toBeVisible();
			await page.getByRole('button', { name: 'Cart', exact: true }).click();
			await expect(page.getByRole('button', { name: 'Best price for my cart' })).toBeDisabled();
			await page.keyboard.press('Escape');
			await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();

			if (layout === 'table') {
				await page.getByRole('button', { name: 'ไทย', exact: true }).click();
				await expect(page.locator('.store')).toHaveAttribute('lang', 'th');
				await expect(page.locator('.store')).toHaveAttribute('data-theme', 'minimal');
				await expect(
					page.locator('#products').getByRole('button', { name: 'ราคาดีที่สุด', exact: true }).first()
				).toBeEnabled();
			}
		} finally {
			resolve();
		}
		await settled.promise;
		if (layout === 'grid') {
			await expect(page.getByRole('log').getByText('What changed', { exact: true })).toBeVisible();
			await expect(quotes.first()).toBeEnabled();
		} else {
			await expect(page.locator('.store')).toHaveAttribute('data-theme', 'minimal');
		}
	});
}
