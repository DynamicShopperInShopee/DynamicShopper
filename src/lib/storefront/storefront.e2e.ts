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
		const originalFetch = window.fetch;
		window.fetch = (input, init) => {
			if (!String(input).endsWith('/api/local-assistant')) return originalFetch(input, init);
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
	await page.goto(storefrontUrl);
	await page.getByRole('button', { name: 'X-ray' }).click();
	await page.getByRole('button', { name: 'Try live model' }).click();
	await page.getByRole('textbox', { name: 'Ask the store' }).fill('playful');
	await page.getByRole('button', { name: 'Send' }).click();
	await expect(page.getByText('Testing the live model')).toBeVisible();
	await page.getByRole('button', { name: 'Filters', exact: true }).click();
	await page.getByRole('checkbox', { name: 'Free shipping only' }).check();
	await page.getByRole('button', { name: 'Apply filters' }).click();
	await page.evaluate(() => window.dispatchEvent(new Event('release-test-response')));
	await expect(page.getByText('Testing the live model')).toHaveCount(0);
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'standard');
	await expect(page.getByRole('checkbox', { name: 'Free shipping only' })).toBeChecked();
});
