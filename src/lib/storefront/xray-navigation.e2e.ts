import { expect, test } from '@playwright/test';

test('the desktop drawer leaves inline comparison and pricing controls unobscured', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/?view=receipt');
	await page.getByRole('searchbox').fill('rice cooker');
	await page.getByRole('button', { name: 'Search', exact: true }).click();
	await page.getByRole('button', { name: 'Compare views', exact: true }).click();
	await page.getByRole('banner').getByRole('button', { name: 'X-ray', exact: true }).click();
	const drawer = page.locator('#store-xray');
	const panes = page.locator('[data-compare-pane]');
	await expect
		.poll(async () => {
			const pane = await panes.last().boundingBox();
			const panel = await drawer.boundingBox();
			return pane && panel ? pane.x + pane.width <= panel.x : false;
		})
		.toBe(true);
	await panes.first().getByRole('button', { name: 'Best price', exact: true }).first().click();
	const total = page.locator('.quote [data-deal-fact="total"]');
	await expect(total).toBeVisible();
	const amount = await total.boundingBox();
	const panel = await drawer.boundingBox();
	expect(amount!.x + amount!.width).toBeLessThanOrEqual(panel!.x);
});

test('the header and direct fragment open the desktop X-ray drawer', async ({ page }) => {
	await page.goto('/?view=receipt#xray');
	const trigger = page.getByRole('banner').getByRole('button', { name: 'X-ray', exact: true });
	await expect(trigger).toBeVisible();
	const drawer = page.locator('#store-xray');
	await expect(drawer).toBeVisible();
	await expect(drawer.getByRole('button', { name: 'Close X-ray' })).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(drawer).toBeHidden();
	await expect(trigger).toBeFocused();
	await trigger.press('x');
	await expect(drawer).toBeVisible();
	await page.keyboard.press('x');
	await expect(drawer).toBeHidden();
	await expect(trigger).toBeFocused();
});

test('the phone X-ray sheet opens from the header and inspection link', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/?view=receipt');
	const trigger = page.getByRole('banner').getByRole('button', { name: 'X-ray', exact: true });
	await trigger.click();
	const sheet = page.getByRole('dialog', { name: 'X-ray', exact: true });
	await expect(sheet).toBeVisible();
	expect((await sheet.boundingBox())?.height).toBeCloseTo(633, 0);
	await page.keyboard.press('x');
	await expect(sheet).toBeHidden();
	await expect(trigger).toBeFocused();
	await page.getByRole('link', { name: 'Inspect this store', exact: true }).click();
	await expect(sheet).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(trigger).toBeFocused();
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
