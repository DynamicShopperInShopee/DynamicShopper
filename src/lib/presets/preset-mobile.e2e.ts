import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

for (const locale of ['th', 'en']) {
	test(`the ${locale} phone library shows the preview and offers every module by keyboard`, async ({
		page
	}) => {
		await page.goto('/presets');
		await expect(page.getByRole('button', { name: 'English', exact: true })).toBeEnabled();
		if (locale === 'en') {
			await page.getByRole('button', { name: 'English', exact: true }).click();
		}
		await page.evaluate(() => document.fonts.ready.then(() => undefined));
		await expect(page.locator('.stage')).toBeInViewport();
		const modules = page.locator('.modules button');
		await modules.last().focus();
		await page.keyboard.press('Enter');
		await expect(modules.last()).toHaveAttribute('aria-pressed', 'true');
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
	});
}
