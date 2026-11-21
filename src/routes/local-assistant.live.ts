import { expect, test } from '@playwright/test';

const endpoint = '/api/local-assistant';

test('blocks untrusted requests and never uses a developer key in the test server', async ({
	request,
	baseURL
}) => {
	expect(baseURL).toBeDefined();
	const verified = { origin: baseURL!, 'content-type': 'application/json' };
	const response = await request.post(endpoint, {
		headers: verified,
		data: { hints: ['playful'] }
	});
	expect(response.status()).toBe(503);
	expect(response.headers()['cache-control']).toBe('no-store');
	expect(await response.json()).toEqual({ error: 'unavailable' });

	const invalidRequests = [
		{
			headers: { ...verified, origin: 'http://127.0.0.1:4184' },
			data: { hints: ['playful'] },
			code: 403
		},
		{
			headers: verified,
			data: { hints: ['playful'], message: 'synthetic-private-data' },
			code: 400
		},
		{ headers: verified, data: { hints: ['฿1500'] }, code: 400 },
		{ headers: { ...verified, 'content-type': 'text/plain' }, data: 'playful', code: 415 },
		{ headers: verified, data: ' '.repeat(1025), code: 413 }
	];
	for (const { headers, data, code } of invalidRequests) {
		const rejected = await request.post(endpoint, { headers, data });
		expect(rejected.status()).toBe(code);
		expect(await rejected.json()).toEqual({ error: 'invalid-request' });
	}
});

test('applies finite model hints without sharing the budget or overriding explicit choices', async ({
	page
}) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'X-ray' }).click();
	await page.getByRole('button', { name: 'Try live model' }).click();

	const requests: string[] = [];
	await page.route(`**${endpoint}`, (route) => {
		requests.push(route.request().postData() ?? '');
		return route.fulfill({
			json: {
				model: 'gpt-5-mini',
				patch: {
					theme: 'vibrant',
					layout: 'list',
					maxPrice: 1,
					price: 1,
					unknown: 'raw-model-text'
				}
			}
		});
	});

	const input = page.getByRole('textbox', { name: 'Ask the store' });
	await input.fill('large print, จอยๆ, under ฿1500, synthetic-private-marker');
	await page.getByRole('button', { name: 'Send' }).click();

	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'large');
	await expect(page.locator('#products .list-layout')).toBeVisible();
	await expect(page.getByText('Live model · gpt-5-mini', { exact: true })).toBeVisible();
	await expect(page.getByText('Invalid proposal fields dropped')).toBeVisible();
	expect(requests).toEqual(['{"hints":["playful","large-text"]}']);

	const picker = page.locator('#products [data-product="cooker-one-button"] [data-fact="price"]');
	await expect(picker).toHaveText('฿690');
	await expect(picker).toHaveAttribute('data-raw', '690');
	await expect(page.getByText('raw-model-text')).toHaveCount(0);
	await expect(page.getByText('synthetic-private-marker')).toHaveCount(0);

	await input.fill('best deal for cooker-one-button');
	await page.getByRole('button', { name: 'Send' }).click();
	await expect(page.locator('[data-deal-fact="total"]')).toHaveText('฿585');
	expect(requests).toHaveLength(1);
});

test('applies the local result when the shopper switches offline during a pending model request', async ({
	page
}) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'X-ray' }).click();
	await page.getByRole('button', { name: 'Try live model' }).click();

	let release = () => {};
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	const requested = page.waitForRequest((request) => request.url().endsWith(endpoint));
	await page.route(`**${endpoint}`, async (route) => {
		await pending;
		try {
			await route.fulfill({ json: { model: 'gpt-5-mini', patch: { theme: 'vibrant' } } });
		} catch {
			// The browser aborts this request when the shopper switches offline.
		}
	});

	try {
		await page.getByRole('textbox', { name: 'Ask the store' }).fill('minimal spec table');
		await page.getByRole('button', { name: 'Send' }).click();
		await requested;
		await expect(page.getByText('Testing the live model', { exact: true })).toBeVisible();
		await page.getByRole('button', { name: 'Force offline' }).click();
		await expect(page.locator('.store')).toHaveAttribute('data-theme', 'minimal');
		release();
		await expect(page.getByText('Offline mode', { exact: true }).first()).toBeVisible();
		await expect(page.getByText('Live model · gpt-5-mini', { exact: true })).toHaveCount(0);
		await expect(page.locator('.store')).toHaveAttribute('data-theme', 'minimal');
	} finally {
		release();
	}
});

test('shows a rejection in X-ray when every model field is unusable', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'X-ray' }).click();
	await page.getByRole('button', { name: 'Try live model' }).click();
	await page.route(`**${endpoint}`, (route) =>
		route.fulfill({ json: { model: 'gpt-5-mini', patch: {}, rejected: true } })
	);
	await page.getByRole('textbox', { name: 'Ask the store' }).fill('minimal spec table');
	await page.getByRole('button', { name: 'Send' }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'minimal');
	await expect(page.getByText('Invalid proposal fields dropped')).toBeVisible();
	await expect(page.getByText('Live model · gpt-5-mini', { exact: true })).toHaveCount(0);
});
