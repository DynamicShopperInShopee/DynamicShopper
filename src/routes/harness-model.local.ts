import { expect, test } from '@playwright/test';

// Exercise the real browser validator/rendering boundary without a network model or key.
test('orders every requested card field, omits others, and reverses the change', async ({
	page
}) => {
	let patch: unknown = {
		cardFields: ['summary', 'specs', 'price'],
		highlightSpecs: ['battery', 'weight']
	};
	await page.route('**/api/assistant', (route) =>
		route.fulfill({
			json: {
				envelope: { intent: 'restyle', patch, reply: 'I have adjusted the view.' }
			}
		})
	);
	await page.goto('/harness');
	await page.getByRole('button', { name: 'Shopping assistant', exact: true }).click();
	await page.getByRole('searchbox').fill('gaming mouse');
	await page.getByRole('searchbox').press('Enter');
	await page.getByRole('button', { name: 'X-ray', exact: true }).click();
	await page.getByRole('button', { name: 'Try live model', exact: true }).click();
	await page
		.getByRole('textbox', { name: 'Ask the store', exact: true })
		.fill('adjust the card details');
	await page.getByRole('button', { name: 'Send', exact: true }).click();
	const card = page.locator('#products .adaptive-card').first();
	const fields = () =>
		card
			.locator('[data-card-field]')
			.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-card-field')));
	await expect.poll(fields).toEqual(['summary', 'specs', 'price']);
	await expect(card.locator('[data-card-field="specs"] [data-fact]').first()).toHaveAttribute(
		'data-fact',
		'spec.battery'
	);
	await expect(card.locator('[data-card-field="image"]')).toHaveCount(0);
	await expect(page.locator('#products [data-proof]')).toHaveAttribute('data-proof', 'verified');
	const before = await card.locator('[data-fact="price"]').getAttribute('data-raw');
	patch = { cardFields: ['reviews', 'image', 'shipping', 'shop', 'rating', 'vouchers', 'price'] };
	await page.getByRole('textbox', { name: 'Ask the store', exact: true }).fill('change card order');
	await page.getByRole('button', { name: 'Send', exact: true }).click();
	await expect
		.poll(fields)
		.toEqual(['reviews', 'image', 'shipping', 'shop', 'rating', 'vouchers', 'price']);
	await expect(card.locator('[data-fact="price"]')).toHaveAttribute('data-raw', before!);
	await expect(page.locator('#products [data-proof]')).toHaveAttribute('data-proof', 'verified');
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect.poll(fields).toEqual(['summary', 'specs', 'price']);
});

test('the local harness accepts a loopback development request with no model credentials', async ({
	page
}) => {
	await page.goto('/harness');
	const reply = await page.evaluate(async () => {
		const response = await fetch('/api/assistant', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ message: 'large text' })
		});
		return {
			status: response.status,
			cache: response.headers.get('cache-control'),
			body: await response.json()
		};
	});
	expect(reply).toMatchObject({
		status: 200,
		cache: 'no-store',
		body: { envelope: null, fallbackReason: 'no_key' }
	});
	await page.getByRole('button', { name: 'Shopping assistant', exact: true }).click();
	await page.getByRole('button', { name: 'X-ray', exact: true }).click();
	await page.getByRole('button', { name: 'Simulate poisoned model' }).click();
	await page.getByRole('textbox', { name: 'Ask the store' }).fill('hello');
	await page.getByRole('button', { name: 'Send', exact: true }).click();
	await expect(page.getByText('Fact guard: replaced')).toBeVisible();
});
