import { expect, test } from '@playwright/test';
import { defaultPlan } from '../personalization/plan';

test('restored preferences remove one entry at a time and Undo restores that entry', async ({
	page
}) => {
	await page.addInitScript(
		(plan) => localStorage.setItem('dynamicshopper.store.v1', JSON.stringify({ plan })),
		{
			...defaultPlan,
			category: 'mouse',
			density: 'compact',
			mallOnly: true,
			shops: ['techhub', 'audiolab'],
			specPreferences: { battery: 'higher', weight: 'lower' }
		}
	);
	await page.goto('/?view=receipt');
	await expect(
		page.getByRole('banner').getByRole('button', { name: 'X-ray', exact: true })
	).toBeEnabled();
	const preferences = page.getByRole('list', { name: 'Store preferences' });
	await expect(preferences.getByRole('button', { name: /Remove Spacing/ })).toBeVisible();
	await expect(preferences.getByRole('button', { name: /Remove Shop type/ })).toBeVisible();
	const battery = preferences.getByRole('button', { name: 'Remove Battery life · Prefer higher' });
	const weight = preferences.getByRole('button', { name: 'Remove Weight · Prefer lower' });
	await battery.click();
	await expect(battery).toHaveCount(0);
	await expect(weight).toBeVisible();
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(battery).toBeVisible();
	await expect(weight).toBeVisible();
	await preferences.getByRole('button', { name: /Remove Shops.*TechHub/ }).click();
	await expect(preferences.getByRole('button', { name: /Remove Shops.*TechHub/ })).toHaveCount(0);
	await expect(preferences.getByRole('button', { name: /Remove Shops.*AudioLab/ })).toBeVisible();
});

test('zero budget has one removable preference and shipping removal is undoable', async ({
	page
}) => {
	await page.goto('/?view=receipt');
	await expect(
		page.getByRole('banner').getByRole('button', { name: 'X-ray', exact: true })
	).toBeEnabled();
	await page.getByRole('button', { name: 'Filters', exact: true }).click();
	await page.getByRole('spinbutton', { name: 'Maximum price (฿)' }).fill('0');
	await page.getByRole('checkbox', { name: 'Free shipping only' }).check();
	await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
	const budget = page.getByRole('button', { name: /Remove Budget/ });
	await expect(budget).toHaveCount(1);
	await expect(budget).toContainText('฿0');
	await expect(page.locator('.chips button').filter({ hasText: 'Maximum price' })).toHaveCount(0);
	await budget.click();
	await expect(budget).toHaveCount(0);
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(budget).toBeVisible();
	const shipping = page
		.locator('.chips')
		.getByRole('button', { name: 'Free shipping only', exact: true });
	await shipping.click();
	await expect(shipping).toHaveCount(0);
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(shipping).toBeVisible();
});
