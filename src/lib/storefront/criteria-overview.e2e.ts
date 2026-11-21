import { expect, test } from '@playwright/test';

test('checks the painted capacity option while Requirements is open', async ({ page }) => {
	await page.goto('/?view=receipt');
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	const criteria = page.getByRole('region', { name: 'Shopping criteria' });
	const requirements = criteria.locator('summary').filter({ hasText: 'Requirements' });
	await requirements.click();
	const picker = criteria.getByRole('combobox', { name: 'Cooker capacity' });
	await picker.selectOption('1.8');
	const proof = page.locator('#products [data-proof]');
	await expect(proof).toHaveAttribute('data-proof', 'verified');
	const selected = picker.locator('option[value="1.8"]');
	await selected.evaluate((node) => node.setAttribute('label', '1 L'));
	await expect(proof).toHaveAttribute('data-proof', 'failed');
	await requirements.click();
	await expect(proof).toHaveAttribute('data-proof', 'verified');
	const summaryCapacity = requirements.locator('[data-fact="spec.capacity"]');
	await summaryCapacity.evaluate((node) => (node.textContent = '1 L'));
	await expect(proof).toHaveAttribute('data-proof', 'failed');
	await summaryCapacity.evaluate((node) => (node.textContent = '1.8 L'));
	await expect(proof).toHaveAttribute('data-proof', 'verified');
	await requirements.click();
	await expect(proof).toHaveAttribute('data-proof', 'failed');
	await selected.evaluate((node) => node.removeAttribute('label'));
	await expect(proof).toHaveAttribute('data-proof', 'verified');
});

test('changing category in Shopping criteria keeps compatible searches and undoes an incompatible switch', async ({
	page,
	context
}) => {
	await page.goto('/?view=receipt');
	await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
	await context.setOffline(true);
	const criteria = page.getByRole('region', { name: 'Shopping criteria' });
	await criteria.locator('summary').filter({ hasText: 'Requirements' }).click();
	const terms = criteria.getByRole('textbox', { name: 'Search terms' });
	await terms.fill('gaming mouse');
	await criteria.getByRole('button', { name: 'Apply search' }).click();
	const category = criteria.getByRole('combobox', { name: 'Product category' });
	await category.selectOption('mouse');
	await expect(terms).toHaveValue('gaming mouse');
	const cards = page.locator('#products [data-product]');
	await expect(cards.first()).toBeVisible();
	const original = await cards.evaluateAll((items) =>
		items.map((item) => item.getAttribute('data-product'))
	);
	await category.selectOption('rice-cooker');
	await expect(terms).toHaveValue('');
	await expect(page.getByRole('searchbox')).toHaveValue('');
	await expect(
		cards.filter({ has: page.locator('[data-product-id="cooker-one-button"]') }).first()
	).toBeVisible();
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(category).toHaveValue('mouse');
	await expect(terms).toHaveValue('gaming mouse');
	await expect
		.poll(() =>
			cards.evaluateAll((items) => items.map((item) => item.getAttribute('data-product')))
		)
		.toEqual(original);
});

for (const lang of ['en', 'th'] as const) {
	test(`a shopper corrects criteria, changes the view and undoes each edit offline in ${lang}`, async ({
		page,
		context
	}) => {
		const th = lang === 'th';
		await page.setViewportSize({ width: th ? 390 : 1440, height: th ? 844 : 900 });
		await page.goto('/?view=receipt');
		await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
		if (th) await page.getByRole('button', { name: 'ไทย', exact: true }).click();
		await context.setOffline(true);
		if (th) await page.getByRole('button', { name: 'แชตกับผู้ช่วย' }).click();
		const message = page.getByRole('textbox', { name: th ? 'ถามหน้าร้าน' : 'Ask the store' });
		await message.fill(
			th
				? 'อยากได้เมาส์น้ำหนักเบา งบไม่เกิน 1500 บาท'
				: 'I need a light weight gaming mouse under 1500 baht'
		);
		await message.press('Enter');
		if (th) await page.keyboard.press('Escape');

		const criteria = page.getByRole('region', {
			name: th ? 'เกณฑ์การเลือกสินค้า' : 'Shopping criteria'
		});
		const requirements = criteria
			.locator('details')
			.filter({ has: page.getByRole('heading', { name: th ? 'เงื่อนไข' : 'Requirements' }) });
		const preferences = criteria
			.locator('details')
			.filter({ has: page.getByRole('heading', { name: th ? 'ความต้องการ' : 'Preferences' }) });
		const view = criteria
			.locator('details')
			.filter({ has: page.getByRole('heading', { name: th ? 'มุมมอง' : 'View' }) });
		await expect(requirements.locator('summary')).toContainText(th ? 'เมาส์เกมมิ่ง' : 'Gaming mice');
		await expect(requirements.locator('summary')).toContainText('1,500');
		await requirements.locator('summary').click();
		const budget = requirements.getByRole('spinbutton', {
			name: th ? 'งบสูงสุด (บาท)' : 'Maximum budget (baht)'
		});
		await expect(budget).toHaveValue('1500');
		await budget.fill('1000');
		await budget.press('Enter');
		await expect(requirements.locator('summary')).toContainText('1,000');
		await preferences.locator('summary').click();
		const weight = preferences.getByRole('combobox', {
			name: th ? 'น้ำหนัก' : 'Weight',
			exact: true
		});
		await expect(weight).toHaveValue('lower');
		await weight.selectOption('');
		await expect(weight).toHaveCount(0);

		await view.locator('summary').click();
		const layout = view.getByRole('combobox', { name: th ? 'การจัดวาง' : 'Layout', exact: true });
		const theme = view.getByRole('combobox', {
			name: th ? 'ธีมหน้าร้าน' : 'Storefront theme',
			exact: true
		});
		await layout.selectOption('table');
		await expect(layout).toHaveValue('table');
		await expect(theme).toHaveValue('standard');
		await expect(page.locator('.store')).toHaveAttribute('lang', lang);
		await expect(requirements.locator('summary')).toContainText('1,000');
		const undo = page.getByRole('button', { name: th ? 'ย้อนกลับ' : 'Undo', exact: true }).first();
		await undo.click();
		await expect(layout).toHaveValue('grid');
		await expect(weight).toHaveCount(0);
		await undo.click();
		await expect(weight).toHaveValue('lower');
		await undo.click();
		await expect(budget).toHaveValue('1500');
		await theme.selectOption('large-print');
		await expect(page.locator('.store')).toHaveAttribute('data-theme', 'large');
		await expect(page.locator('.store')).toHaveAttribute('lang', lang);
		await expect(layout).toHaveValue('grid');
		const localeControl = view.getByRole('combobox', {
			name: th ? 'ภาษาที่แสดง' : 'Display language'
		});
		await localeControl.selectOption(th ? 'en' : 'th');
		await expect(page.locator('.store')).toHaveAttribute('lang', th ? 'en' : 'th');
		await expect(page.locator('.store')).toHaveAttribute('data-theme', 'large');
		await expect(page.locator('#criteria-overview [data-preference="maxPrice"]')).toHaveAttribute(
			'data-raw',
			'1500'
		);
		await page
			.getByRole('button', { name: th ? 'Undo' : 'ย้อนกลับ', exact: true })
			.first()
			.click();
		await expect(page.locator('.store')).toHaveAttribute('lang', lang);
		await expect(theme).toHaveValue('large-print');
		await undo.click();
		await expect(theme).toHaveValue('standard');
		await expect
			.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
			.toBe(true);
	});
}
