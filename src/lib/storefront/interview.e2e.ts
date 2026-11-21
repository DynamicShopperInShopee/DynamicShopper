import { expect, test, type Page } from '@playwright/test';

async function interview(page: Page, thai = false, editing = false) {
	await page
		.getByRole('button', {
			name: editing ? 'Edit my answers' : thai ? 'เริ่มตอบคำถามสั้น ๆ' : 'Start a quick interview',
			exact: true
		})
		.click();
	const dialog = page.getByRole('dialog', {
		name: thai ? 'ปรับร้านให้เหมาะกับคุณ' : 'Make the shop fit you'
	});
	for (const [question, answer] of [
		['goal', 'browse'],
		['evidence', 'specs'],
		['priority', 'value'],
		['reading', 'compact']
	]) {
		await dialog.locator(`input[name="${question}"][value="${answer}"]`).check();
		await dialog
			.getByRole('button', {
				name:
					question === 'reading'
						? thai
							? 'ตอบเสร็จแล้ว'
							: 'Finish interview'
						: thai
							? 'ถัดไป'
							: 'Next',
				exact: true
			})
			.click();
	}
}

for (const width of [390, 1440]) {
	test(`interview preserves cart, filters, locks and Undo through listing navigation at ${width}px`, async ({
		page
	}) => {
		await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
		await page.goto('/');
		await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
		await page.getByRole('button', { name: '1.8 L', exact: true }).click();
		await interview(page);
		await expect(page.locator('.store')).not.toHaveClass(/(?:^|\s)event-demo(?:\s|$)/);
		await expect(page.getByRole('link', { name: 'DynamicShopper', exact: true })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Cart', exact: true })).toBeVisible();
		await expect(page.locator('.store')).toHaveAttribute('data-density', 'compact');
		await page.locator('[data-product-card] .product-link').first().click();
		await page.getByRole('link', { name: 'Back to store', exact: true }).click();
		await expect(page.locator('.store')).not.toHaveClass(/(?:^|\s)event-demo(?:\s|$)/);
		await expect(page.locator('.store')).toHaveAttribute('data-density', 'compact');
		await expect(page.locator('#products [data-fact="spec.capacity"]').first()).toHaveAttribute(
			'data-raw',
			'1.8'
		);
		await interview(page, false, true);
		if (width === 390) await page.getByRole('button', { name: 'Chat with the assistant' }).click();
		await page.getByRole('textbox', { name: 'Ask the store' }).fill('visual style');
		await page.getByRole('button', { name: 'Send', exact: true }).click();
		await expect(page.locator('.store')).toHaveAttribute('data-density', 'compact');
		if (width === 390) await page.keyboard.press('Escape');
		await page.getByRole('button', { name: 'Undo', exact: true }).click();
		await expect(page.locator('.store')).not.toHaveClass(/(?:^|\s)event-demo(?:\s|$)/);
		await page.getByRole('button', { name: 'Undo', exact: true }).click();
		await expect(page.locator('.store')).toHaveClass(/(?:^|\s)event-demo(?:\s|$)/);
		await expect(page.getByRole('button', { name: '1.8 L', exact: true })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await expect
			.poll(() =>
				page.evaluate(
					() =>
						(
							JSON.parse(localStorage.getItem('dynamicshopper.store.v1') ?? '{}') as {
								plan?: { density?: string };
							}
						).plan?.density
				)
			)
			.toBe('comfortable');
	});
}

test('interview drafts leave the store alone and Thai Apply retains the project identity', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await page.getByRole('button', { name: 'Start a quick interview', exact: true }).click();
	await page.locator('input[name="goal"][value="compare"]').check();
	await page.keyboard.press('Escape');
	await expect(page.locator('.store')).toHaveClass(/(?:^|\s)event-demo(?:\s|$)/);
	await page.getByRole('button', { name: 'ไทย', exact: true }).click();
	await interview(page, true);
	await expect(page.getByRole('link', { name: 'DynamicShopper', exact: true })).toBeVisible();
	await expect(page.locator('.store')).toHaveAttribute('lang', 'th');
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
