import { expect, test } from '@playwright/test';

test('a Legacy capacity choice survives assistant, Undo, ranking and listing navigation', async ({
	page
}) => {
	await page.goto('/');
	await page.getByRole('searchbox').fill('rice cooker');
	await page.getByRole('searchbox').press('Enter');
	const filters = page.getByRole('navigation', { name: 'Rice cooker filters' });
	await filters.getByRole('button', { name: '1.8 L', exact: true }).click();
	const ids = () =>
		page
			.locator('#products [data-product-card], #products tbody tr[data-product]')
			.evaluateAll((nodes) =>
				nodes
					.map(
						(node) => node.getAttribute('data-product-card') ?? node.getAttribute('data-product')
					)
					.sort()
			);
	const selected = await ids();
	expect(selected.length).toBeGreaterThan(0);
	expect(selected.length).toBeLessThan(6);
	await filters.getByRole('link', { name: 'Shopping assistant', exact: true }).click();
	await expect(page).toHaveURL(/\?view=receipt/);
	await expect(page.locator('.store')).not.toHaveClass(/event-demo/);
	await expect.poll(ids).toEqual(selected);
	const capacityChip = page
		.locator('.chips button')
		.filter({ has: page.locator('[data-fact="spec.capacity"]') });
	await expect(capacityChip).toBeVisible();
	const proof = page.locator('#products [data-proof]');
	const capacity = capacityChip.locator('[data-fact="spec.capacity"]');
	await expect(proof).toHaveAttribute('data-proof', 'verified');
	await capacity.evaluate((node) => (node.textContent = '1 L'));
	await expect(proof).toHaveAttribute('data-proof', 'failed');
	await capacityChip.click();
	await expect.poll(async () => (await ids()).length).toBe(6);
	await expect(proof).toHaveAttribute('data-proof', 'verified');
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect.poll(ids).toEqual(selected);
	await page.getByRole('button', { name: 'Shopper views', exact: true }).click();
	await page.getByRole('button', { name: 'Tech minimal', exact: true }).click();
	await expect.poll(ids).toEqual(selected);
	await page.locator('#products tbody th a').first().click();
	await page.getByRole('link', { name: 'Back to store', exact: true }).click();
	await expect.poll(ids).toEqual(selected);
});
