import { expect, test } from '@playwright/test';

test('explains the score of the first product in the offline Thai spec table', async ({
	page,
	context
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/?view=receipt');
	await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
	await context.setOffline(true);
	await page.getByRole('searchbox').fill('gaming mouse');
	await page.getByRole('button', { name: 'Search', exact: true }).click();
	await page.getByRole('textbox', { name: 'Ask the store' }).fill('ขอแบบเรียบๆ ดูสเปกก่อน');
	await page.getByRole('button', { name: 'Send', exact: true }).click();
	const table = page.getByRole('table');
	await expect(table).toBeVisible();
	await page.getByRole('button', { name: 'ไทย', exact: true }).click();
	await page
		.getByRole('textbox', { name: 'ถามหน้าร้าน' })
		.fill('I care about battery and light weight, under 1500 baht');
	await page.getByRole('button', { name: 'ส่ง', exact: true }).click();

	const firstProduct = table.locator('tbody tr').first();
	await expect(firstProduct).toHaveAttribute('data-product', 'aero-x');
	const explanation = firstProduct.locator('details').filter({ hasText: 'ทำไมจึงเรียงแบบนี้' });
	await explanation.getByText('ทำไมจึงเรียงแบบนี้').press('Enter');

	const specReasons = explanation.getByRole('listitem').filter({ hasText: /อายุแบตเตอรี่|น้ำหนัก/ });
	await expect(specReasons).toHaveText(['น้ำหนัก', 'อายุแบตเตอรี่']);
	await expect(explanation).not.toContainText(/[\p{N}\p{Sc}]/u);
	await expect(firstProduct.locator('[data-fact="spec.battery"]')).toHaveAttribute(
		'data-raw',
		'95'
	);
});
