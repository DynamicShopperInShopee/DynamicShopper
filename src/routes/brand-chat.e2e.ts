import { expect, test, type Locator } from '@playwright/test';
test.setTimeout(15000);
for (const width of [390, 1440])
	for (const [theme, message] of [
		['minimal', 'minimal'],
		['vibrant', 'visual style'],
		['large', 'large print'],
		['standard', 'standard theme']
	]) {
		test(`fixed brand during chat ${theme} ${width}`, async ({ page }) => {
			await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
			await page.goto('/');
			const header = page.locator('.marketplace-brand');
			await expect(header).toHaveCSS('background-color', 'rgb(238, 77, 45)');
			await expect(page.locator('.marketplace-identity')).toHaveCSS('color', 'rgb(255, 255, 255)');
			await expect(page.getByRole('button', { name: 'Search', exact: true })).toHaveCSS(
				'background-color',
				'rgb(181, 50, 26)'
			);
			await page.getByRole('link', { name: 'Shopping assistant', exact: true }).click();
			await expect(page.getByRole('textbox', { name: 'Ask the store' })).toBeVisible();
			await page.getByRole('textbox', { name: 'Ask the store' }).fill(message);
			await page.getByRole('button', { name: 'Send', exact: true }).click();
			await expect(page.locator('.store')).toHaveAttribute('data-theme', theme);
			if (width === 390) await page.keyboard.press('Escape');
			await expect(page.locator('.masthead')).toHaveCSS('background-color', 'rgb(238, 77, 45)');
			await expect(page.locator('.brand')).toHaveCSS('color', 'rgb(255, 255, 255)');
			await expect(page.getByRole('button', { name: 'Search', exact: true })).toHaveCSS(
				'background-color',
				'rgb(181, 50, 26)'
			);
			await expect(page.locator('#products')).toBeVisible();
			expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
		});
	}

async function controlContrast(control: Locator) {
	return control.evaluate((node) => {
		function luminance(color: string) {
			const [red, green, blue] = (color.match(/[\d.]+/g) ?? []).map(Number).map((value) => {
				const channel = value / 255;
				return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
			});
			return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
		}

		let layer = node;
		let background = getComputedStyle(layer).backgroundColor;
		while (layer.parentElement && background === 'rgba(0, 0, 0, 0)') {
			layer = layer.parentElement;
			background = getComputedStyle(layer).backgroundColor;
		}
		const ink = luminance(getComputedStyle(node).color);
		const paper = luminance(background);
		return (Math.max(ink, paper) + 0.05) / (Math.min(ink, paper) + 0.05);
	});
}

for (const category of ['Rice cookers', 'Skincare']) {
	test(`compact orange search controls stay readable on phone ${category} results`, async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
		await page.getByRole('button', { name: category, exact: true }).click();
		const row = page.getByRole('search');
		await expect(row).toHaveCSS('background-color', 'rgb(238, 77, 45)');
		await expect(page.locator('.marketplace-brand')).toBeHidden();

		const back = row.getByRole('button', { name: 'Reset search' });
		const input = row.getByRole('searchbox');
		const submit = row.getByRole('button', { name: 'Search', exact: true });
		const sort = category === 'Rice cookers';
		const secondary = sort
			? row.getByRole('combobox', { name: 'Sort by' })
			: row.getByRole('button', { name: 'Filters' });
		const language = row.getByRole('button', { name: 'ไทย', exact: true });
		await expect(submit).toHaveCSS('background-color', 'rgb(181, 50, 26)');

		for (const control of [back, input, submit, secondary, language]) {
			await expect(control).toBeVisible();
			const bounds = (await control.boundingBox())!;
			expect(Math.min(bounds.width, bounds.height)).toBeGreaterThanOrEqual(44);
		}
		for (const control of [input, language]) {
			expect(await controlContrast(control)).toBeGreaterThanOrEqual(4.5);
		}
		expect(await controlContrast(back)).toBeGreaterThanOrEqual(3);
		expect(await controlContrast(submit)).toBeGreaterThanOrEqual(3);
		const paintedSecondary = sort ? row.locator('label:has(select)') : secondary;
		expect(await controlContrast(paintedSecondary)).toBeGreaterThanOrEqual(sort ? 3 : 4.5);

		await back.focus();
		for (const control of [input, submit, secondary, language]) {
			await page.keyboard.press('Tab');
			await expect(control).toBeFocused();
		}
		await page.keyboard.press('Enter');
		const english = row.getByRole('button', { name: 'English', exact: true });
		await expect(page.locator('.store')).toHaveAttribute('lang', 'th');
		await expect(english).toBeFocused();
		expect(await controlContrast(english)).toBeGreaterThanOrEqual(4.5);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
		await english.press('Enter');
		await back.press('Enter');
		await expect(page.locator('.marketplace-brand')).toBeVisible();
	});
}
