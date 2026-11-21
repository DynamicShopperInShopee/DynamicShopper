import { expect, test } from '@playwright/test';
import { parseSharedLook } from './browserState';
import { lookFields, validateLook } from './sharedLook';

test('the ranked table explains its order and keeps the active look on listing links', async ({
	page
}) => {
	await page.goto('/?view=receipt&look=minimal.table.en');
	await page.getByRole('searchbox').fill('rice cooker');
	await page.getByRole('button', { name: 'Search', exact: true }).click();
	const row = page.locator('#products tr[data-product="cooker-one-button"]');
	const reasons = row.locator('.rank');
	await reasons.locator('summary').click();
	await expect(reasons.locator('[data-rank-bar]').first()).toBeVisible();
	expect(await reasons.innerText()).not.toMatch(/\p{N}/u);
	await expect(reasons).toContainText('Rating');
	const link = row.locator('th a');
	await expect(link).toHaveAttribute('href', /theme=minimal/);
	const target = new URL((await link.getAttribute('href'))!, page.url());
	expect(parseSharedLook(target.searchParams.get('look')!, lookFields, validateLook)).toMatchObject(
		{
			theme: 'minimal',
			layout: 'table',
			locale: 'en'
		}
	);
	await link.click();
	await expect(page.locator('main')).toHaveAttribute('data-theme', 'minimal');
	await page.getByRole('link', { name: 'Back to store', exact: true }).click();
	await expect(page.getByRole('searchbox')).toHaveValue('rice cooker');
	await expect(page.locator('#products table')).toBeVisible();
});
