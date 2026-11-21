import { expect, test } from '@playwright/test';

test('the last Skip completes one change, focuses its receipt and leaves no manual view chooser', async ({
	page
}) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Start a quick interview' }).click();
	const dialog = page.getByRole('dialog');
	await dialog.getByRole('radio', { name: 'Compare', exact: true }).check();
	await dialog.getByRole('button', { name: 'Next', exact: true }).click();
	for (let step = 0; step < 2; step++) await dialog.getByRole('button', { name: /Skip/ }).click();
	await expect(page.locator('.store')).toHaveClass(/event-demo/);
	await dialog.getByRole('button', { name: /Skip/ }).click();
	await expect(dialog).toHaveCount(0);
	await expect(page.locator('#store-change-receipt')).toBeFocused();
	await expect(page.getByRole('region', { name: 'Product table' })).toBeVisible();
	await expect(page.getByRole('combobox', { name: 'Theme', exact: true })).toHaveCount(0);
	await expect(page.locator('[id^="persona-"]')).toHaveCount(0);
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.locator('.store')).toHaveClass(/event-demo/);
	await expect(page.getByRole('button', { name: 'Start a quick interview' })).toBeVisible();
});

async function answerInterview(
	page: import('@playwright/test').Page,
	labels: string[],
	directOnly?: boolean
) {
	const dialog = page.getByRole('dialog', { name: 'Make the shop fit you' });
	if (directOnly !== undefined) {
		await dialog.getByText('How this view is chosen', { exact: true }).click();
		await dialog.getByRole('checkbox', { name: 'Use direct answers only' }).setChecked(directOnly);
	}
	for (const [index, label] of labels.entries()) {
		await dialog.getByRole('radio', { name: label, exact: true }).check();
		await dialog
			.getByRole('button', {
				name: index === labels.length - 1 ? 'Finish interview' : 'Next',
				exact: true
			})
			.click();
	}
	return dialog;
}

test('the shortlist and specification choices appear on the applied shelf', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Start a quick interview' })).toBeEnabled();
	await page.getByRole('button', { name: 'Start a quick interview' }).click();
	await answerInterview(page, ['Help me choose', 'Specs', 'Durability', 'Balanced'], true);
	await expect(page.getByRole('region', { name: 'Top picks' }).getByRole('link')).toHaveCount(3);
	await expect(
		page.locator('#products .product').first().locator('[data-fact^="spec."]').first()
	).toBeVisible();
	await expect(page.locator('#products .product').first().locator('.art')).toHaveCount(0);
});

test('interview adapts the existing marketplace offline, then chat and Undo preserve catalog facts', async ({
	page,
	context
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Start a quick interview' })).toBeEnabled();
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	const before = await page
		.locator('#products [data-fact="price"]')
		.evaluateAll(
			(nodes) =>
				Object.fromEntries(
					nodes.map((node) => [node.getAttribute('data-product-id'), node.getAttribute('data-raw')])
				) as Record<string, string | null>
		);
	await page.getByRole('button', { name: 'Start a quick interview' }).click();
	await context.setOffline(true);
	const dialog = await answerInterview(page, ['Compare', 'Specs', 'Durability', 'Large text']);
	await expect(dialog).toHaveCount(0);
	await expect(page.locator('.store')).not.toHaveClass(/event-demo/);
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'large');
	await expect(page.getByRole('region', { name: 'Product table' })).toBeVisible();
	await expect(page.locator('#store-change-receipt')).toBeFocused();
	await expect(page.getByRole('region', { name: 'What matters', exact: true })).toContainText(
		'Durability'
	);
	await expect(page.getByRole('region', { name: 'What matters', exact: true })).not.toContainText(
		'Performance'
	);
	const after = await page
		.locator('#products [data-fact="price"]')
		.evaluateAll(
			(nodes) =>
				Object.fromEntries(
					nodes.map((node) => [node.getAttribute('data-product-id'), node.getAttribute('data-raw')])
				) as Record<string, string | null>
		);
	expect(after).toEqual(before);
	await page.getByRole('button', { name: 'Refine this view in chat' }).click();
	const input = page.getByRole('textbox', { name: 'Ask the store' });
	await expect(input).toBeFocused();
	await input.fill('list view');
	await page.getByRole('button', { name: 'Send', exact: true }).click();
	await page.getByRole('button', { name: 'Close chat' }).click();
	await expect(page.locator('.list-layout')).toBeVisible();
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.getByRole('region', { name: 'Product table' })).toBeVisible();
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.locator('.store')).toHaveClass(/event-demo/);
	await expect(page.locator('#products')).toBeFocused();
	await expect(page.getByRole('button', { name: 'Start a quick interview' })).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('cancelling a draft is inert; partial answers preserve explicit filters', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Start a quick interview' })).toBeEnabled();
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	await page
		.getByRole('navigation', { name: 'Rice cooker filters' })
		.getByRole('button', { name: '1.8 L', exact: true })
		.click();
	await page.getByRole('button', { name: 'Start a quick interview' }).click();
	await page.getByRole('radio').first().check();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page.locator('.store')).toHaveClass(/event-demo/);
	await expect(page.locator('.product-grid > li')).toHaveCount(2);
	await page.getByRole('button', { name: 'Start a quick interview' }).click();
	const dialog = page.getByRole('dialog', { name: 'Make the shop fit you' });
	await dialog.getByRole('radio', { name: 'Compare', exact: true }).check();
	await dialog.getByRole('button', { name: 'Next', exact: true }).click();
	for (let i = 0; i < 3; i++)
		await dialog
			.getByRole('button', { name: 'Skip — keep my current settings', exact: true })
			.click();
	await expect(page.locator('#products [data-fact="price"]')).toHaveCount(2);
	await expect(page.getByRole('button', { name: 'Capacity 1.8 L' })).toBeVisible();
	await page.getByRole('button', { name: 'Reset store', exact: true }).click();
	await expect(page.locator('.store')).toHaveClass(/event-demo/);
	await expect(page.getByRole('button', { name: 'Capacity 1.8 L' })).toHaveCount(0);
});

test('an empty interview proposal does not consume the next Undo', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Start a quick interview' })).toBeEnabled();
	await page.getByRole('button', { name: 'Start a quick interview' }).click();
	const skipped = page.getByRole('dialog', { name: 'Make the shop fit you' });
	for (let i = 0; i < 4; i++)
		await skipped
			.getByRole('button', { name: 'Skip — keep my current settings', exact: true })
			.click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page.locator('.store')).toHaveClass(/event-demo/);
	await expect(page.getByRole('button', { name: 'Start a quick interview' })).toBeVisible();
	await page.getByRole('button', { name: 'Start a quick interview' }).click();
	await answerInterview(page, ['Compare', 'Specs', 'Durability', 'Large text']);
	await page.getByRole('button', { name: 'Edit my answers' }).click();
	const edit = page.getByRole('dialog', { name: 'Make the shop fit you' });
	for (let i = 0; i < 4; i++)
		await edit
			.getByRole('button', { name: 'Skip — keep my current settings', exact: true })
			.click();
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.locator('.store')).toHaveClass(/event-demo/);
	await expect(page.getByRole('button', { name: 'Start a quick interview' })).toBeVisible();
});

test('direct-only choice survives no-op completion without consuming Undo', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Start a quick interview' })).toBeEnabled();
	await page.getByRole('button', { name: 'Start a quick interview' }).click();
	await answerInterview(page, ['Compare', 'Specs', 'Durability', 'Large text']);
	await page.getByRole('button', { name: 'Edit my answers' }).click();
	await answerInterview(page, ['Compare', 'Specs', 'Durability', 'Large text'], true);
	await page.getByRole('button', { name: 'Edit my answers' }).click();
	const reopened = page.getByRole('dialog', { name: 'Make the shop fit you' });
	await reopened.getByText('How this view is chosen', { exact: true }).click();
	await expect(reopened.getByRole('checkbox', { name: 'Use direct answers only' })).toBeChecked();
	await page.keyboard.press('Escape');
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.locator('.store')).toHaveClass(/event-demo/);
});
