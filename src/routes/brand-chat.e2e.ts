import { expect, test } from '@playwright/test';
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
			const surface = page.locator('.masthead');
			await expect(surface.getByRole('link', { name: /DynamicShopper/ })).toBeVisible();
			expect(
				await surface.evaluate((el) => {
					const style = getComputedStyle(el);
					const swatch = document.createElement('span');
					el.append(swatch);
					swatch.style.color = 'var(--surface)';
					const color = getComputedStyle(swatch).color;
					swatch.remove();
					return style.backgroundColor === color;
				})
			).toBe(true);
			await expect(page.locator('#products')).toBeVisible();
			expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
		});
	}
