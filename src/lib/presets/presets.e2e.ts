import { expect, test } from '@playwright/test';
import { parts } from './parts';
import { shopPresets } from './plans';

test('the module review exposes service dependencies and recoverable error states', async ({
	page
}) => {
	await page.goto('/presets');
	await page.getByRole('button', { name: 'English', exact: true }).click();
	await expect(page.locator('.count strong')).toHaveText('177');
	await expect(
		page.getByRole('navigation', { name: 'Website parts' }).getByRole('button')
	).toHaveCount(12);
	await page.getByRole('combobox', { name: 'Data state', exact: true }).selectOption('error');
	await expect(page.getByRole('alert')).toContainText('unavailable');
	await page.getByRole('button', { name: 'Try again', exact: true }).click();
	await expect(page.getByRole('alert')).toHaveCount(0);
});

test('presentation examples remain isolated from the store', async ({ page }) => {
	await page.goto('/?view=receipt');
	await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
	const view = page
		.locator('#criteria-overview details')
		.filter({ has: page.getByRole('heading', { name: 'View', exact: true }) });
	await view.locator('summary').click();
	await view.getByRole('combobox', { name: 'Storefront theme' }).selectOption('minimal');
	const stored = () => page.evaluate(() => localStorage.getItem('dynamicshopper.store.v1'));
	await expect.poll(async () => JSON.parse((await stored()) ?? '{}').plan?.theme).toBe('minimal');
	const before = await stored();
	await page.goto('/presets');
	await page.getByRole('button', { name: 'English', exact: true }).click();
	await page
		.getByRole('combobox', { name: 'Example', exact: true })
		.selectOption({ label: 'Large-print comparison' });
	await expect(page.getByRole('button', { name: /Apply/ })).toHaveCount(0);
	expect(await stored()).toBe(before);
	await page.getByRole('link', { name: 'Back to the store', exact: true }).click();
	await page.getByRole('link', { name: 'Shopping assistant', exact: true }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'minimal');
	await expect(page.locator('#products table')).toHaveCount(0);
});

test('inspection uses the shared ranking and opens its leading listing in Thai large print', async ({
	page
}) => {
	await page.goto('/presets');
	await page.locator('.examples select').selectOption('large-comparison');
	const links = page.locator('.example-shelf a[href*="/product/"]');
	await expect(links.first()).toHaveAttribute('href', '/product/cooker-ih?lang=th&theme=large');
	await links.first().click();
	await expect(page).toHaveURL(/\/product\/cooker-ih\?lang=th&theme=large$/);
});

test('module reading controls apply and undo locally and carry the active settings into listings', async ({
	page,
	context
}) => {
	await page.goto('/presets?module=account-safety-02');
	await page.getByRole('button', { name: 'English', exact: true }).click();
	await context.setOffline(true);
	const canvas = page.locator('[data-preset="account-safety-02"]');
	const links = canvas.locator('a[href*="/product/"]');
	const first = links.first();
	await expect(first).toHaveAttribute('href', /\?lang=en&theme=standard$/);
	await canvas.getByRole('combobox', { name: 'Reading style', exact: true }).selectOption('large');
	await canvas.getByRole('button', { name: 'Apply reading style' }).click();
	await expect(first).toHaveAttribute('href', /\?lang=en&theme=large$/);
	await canvas.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(first).toHaveAttribute('href', /\?lang=en&theme=standard$/);
	await page.getByLabel('Theme', { exact: true }).selectOption('minimal');
	await expect(first).toHaveAttribute('href', /\?lang=en&theme=minimal$/);
});

test('every registered module and authored example can be inspected', async ({ page }) => {
	test.setTimeout(120_000);
	await page.goto('/presets');
	await page.getByRole('button', { name: 'English', exact: true }).click();
	const nav = page.getByRole('navigation', { name: 'Website parts' });
	const group = page.getByRole('group', { name: 'Modules in this part' });
	for (const [partIndex, part] of parts.entries()) {
		await nav.getByRole('button').nth(partIndex).click();
		await expect(group.getByRole('button')).toHaveCount(part.recipes.length);
		for (const [index, recipe] of part.recipes.entries()) {
			await group.getByRole('button').nth(index).click();
			await expect(page.locator('[data-preset]')).toHaveAttribute('data-preset', recipe.id);
		}
	}
	const examples = page.getByLabel('Example', { exact: true });
	await expect(examples.locator('option')).toHaveCount(shopPresets.length);
	for (const preset of shopPresets) {
		await examples.selectOption(preset.id);
		await expect(page.locator('.example-shelf')).toHaveAttribute(
			'data-storefront-theme',
			preset.patch.theme!
		);
	}
});
