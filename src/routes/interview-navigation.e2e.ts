import { expect, test } from '@playwright/test';

for (const method of ['browser Back', 'listing Back', 'listing Search']) {
	test(`the applied interview and Undo survive ${method}`, async ({ page, context }) => {
		await page.goto('/');
		await expect(page.getByRole('button', { name: 'Start a quick interview' })).toBeEnabled();
		await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
		await page.getByRole('button', { name: '1.8 L', exact: true }).click();
		await page.getByRole('button', { name: 'Start a quick interview' }).click();
		const dialog = page.getByRole('dialog');
		await dialog.getByRole('radio', { name: 'Compare', exact: true }).check();
		await dialog.getByRole('button', { name: 'Next', exact: true }).click();
		for (let step = 0; step < 3; step++) await dialog.getByRole('button', { name: /Skip/ }).click();
		await dialog.getByRole('button', { name: 'Apply my view' }).click();
		const table = page.getByRole('region', { name: 'Product table' });
		await table.getByRole('link').first().click();
		await expect(page.getByRole('link', { name: 'Back to store' })).toBeVisible();
		expect(await page.evaluate(() => JSON.stringify(history.state))).not.toMatch(
			/interviewAnswers|interviewDirectOnly|priorities|undoStack/
		);
		await context.setOffline(true);
		if (method === 'browser Back') await page.goBack();
		else
			await page
				.getByRole('link', {
					name: method === 'listing Back' ? 'Back to store' : 'Search products'
				})
				.click();
		await expect(page).toHaveURL(/\/$/);
		await expect(table.locator('tbody tr')).toHaveCount(2);
		await expect(page.getByRole('button', { name: 'Edit my answers' })).toBeVisible();
		await page.getByRole('button', { name: 'Undo', exact: true }).click();
		await expect(page.getByRole('button', { name: 'Start a quick interview' })).toBeVisible();
		await expect(page.getByRole('button', { name: '1.8 L', exact: true })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});
}

test('an interview listing return keeps the reply proof and focused product', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/?view=receipt');
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	await page.getByRole('button', { name: 'Start a quick interview' }).click();
	const dialog = page.getByRole('dialog');
	await dialog.getByRole('radio', { name: 'Compare', exact: true }).check();
	await dialog.getByRole('button', { name: 'Next', exact: true }).click();
	for (let step = 0; step < 3; step++) await dialog.getByRole('button', { name: /Skip/ }).click();
	await dialog.getByRole('button', { name: 'Apply my view' }).click();
	const table = page.getByRole('region', { name: 'Product table' });
	const focusProduct = table.locator('tr[data-product="cooker-one-button"]');
	await focusProduct.getByRole('button', { name: 'Best price', exact: true }).click();
	await page.getByRole('button', { name: 'Close receipt', exact: true }).click();

	const composer = page.getByRole('textbox', { name: 'Ask the store' });
	const citations = page.getByRole('region', { name: 'From the listing' });
	await composer.fill('What is the capacity?');
	await composer.press('Enter');
	await expect(citations.getByRole('link')).toHaveAttribute(
		'href',
		/^\/product\/cooker-one-button\?/
	);
	const xray = page.getByRole('button', { name: 'X-ray', exact: true });
	const proof = page.locator('#store-xray');
	await xray.click();
	for (const label of ['Offline', 'Reply passed', 'Store unchanged'])
		await expect(proof.getByText(label, { exact: true })).toBeVisible();
	await proof.getByRole('button', { name: 'Close X-ray' }).click();

	await table.locator('a[href^="/product/cooker-ih?"]').click();
	expect(await page.evaluate(() => JSON.stringify(history.state))).not.toMatch(
		/focusedProduct|traceMerge|cooker-one-button/
	);
	await page.getByRole('link', { name: 'Back to store', exact: true }).click();
	await xray.click();
	await expect.soft(proof).toContainText('Reply passed');
	await expect.soft(proof).toContainText('Store unchanged');
	await proof.getByRole('button', { name: 'Close X-ray' }).click();
	await composer.fill('What is the capacity?');
	await composer.press('Enter');
	await expect(citations).toHaveCount(2);
	await expect(citations.last().getByRole('link')).toHaveAttribute(
		'href',
		/^\/product\/cooker-one-button\?/
	);
});

test('an interview listing returns to the receipt URL and its shared look', async ({ page }) => {
	const origin = '/?view=receipt&look=minimal.grid.en';
	await page.goto(origin);
	await page.getByRole('button', { name: 'Start a quick interview' }).click();
	const dialog = page.getByRole('dialog');
	await dialog.getByRole('radio', { name: 'Compare', exact: true }).check();
	await dialog.getByRole('button', { name: 'Next', exact: true }).click();
	for (let step = 0; step < 3; step++) await dialog.getByRole('button', { name: /Skip/ }).click();
	await dialog.getByRole('button', { name: 'Apply my view' }).click();
	await page.getByRole('region', { name: 'Product table' }).getByRole('link').first().click();
	const back = page.getByRole('link', { name: 'Back to store' });
	await expect(back).toHaveAttribute('href', origin);
	await back.click();
	await expect(page).toHaveURL((url) => url.pathname + url.search === origin);
	await expect(page.getByRole('button', { name: 'Edit my answers' })).toBeVisible();
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'minimal');
	await expect(page.getByRole('region', { name: 'Product table' })).toHaveCount(0);
});

test('the harness keeps marketplace filters after a no-op interview', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	await page.getByRole('button', { name: '1.8 L', exact: true }).click();
	await page.getByRole('button', { name: 'Start a quick interview' }).click();
	const dialog = page.getByRole('dialog');
	for (let step = 0; step < 3; step++) await dialog.getByRole('button', { name: /Skip/ }).click();
	await dialog.getByRole('radio', { name: 'Balanced', exact: true }).check();
	await dialog.getByRole('button', { name: 'Preview my view' }).click();
	await dialog.getByRole('button', { name: 'Apply my view' }).click();
	await expect(page.getByRole('button', { name: 'Edit my answers' })).toBeVisible();
	await page.getByRole('link', { name: 'Explore the agent harness' }).click();
	await expect(page).toHaveURL(/\/harness#assistant$/);
	await expect(page.getByRole('button', { name: '1.8 L', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect(page.locator('#products [data-fact="price"]')).toHaveCount(2);
});

test('a comparison listing without a checkpoint retains its receipt return', async ({ page }) => {
	await page.goto('/?utm_source=demo');
	await page.getByRole('button', { name: 'Start a quick interview' }).click();
	const dialog = page.getByRole('dialog');
	await dialog.getByRole('radio', { name: 'Compare', exact: true }).check();
	await dialog.getByRole('button', { name: 'Next', exact: true }).click();
	for (let step = 0; step < 3; step++) await dialog.getByRole('button', { name: /Skip/ }).click();
	await dialog.getByRole('button', { name: 'Apply my view' }).click();
	await page.getByRole('link', { name: 'Compare views', exact: true }).click();
	await page
		.getByRole('region', { name: 'Left view' })
		.locator('a[href*="/product/"]')
		.first()
		.click();
	const back = page.getByRole('link', { name: 'Back to store' });
	await expect(back).toHaveAttribute('href', /^\/\?view=receipt&look=/);
	await back.click();
	await expect(page).toHaveURL(
		(url) => url.pathname === '/' && url.searchParams.get('view') === 'receipt'
	);
});
