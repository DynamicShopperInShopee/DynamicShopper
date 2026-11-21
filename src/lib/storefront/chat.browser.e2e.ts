import { expect, test } from '@playwright/test';

test('keeps the desktop chat beside the shelf while a shopper reads an offline reply', async ({
	page,
	context
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/?view=receipt');
	const dock = page.getByRole('complementary', { name: 'Chat with the assistant' });
	await expect(dock).toBeVisible();
	await expect(page.getByRole('link', { name: 'Compare views', exact: true })).toHaveAttribute(
		'data-offline-ready',
		'true'
	);
	await context.setOffline(true);
	const shelf = page.locator('#products');
	expect((await shelf.boundingBox())!.x + (await shelf.boundingBox())!.width).toBeLessThanOrEqual(
		(await dock.boundingBox())!.x
	);
	await dock
		.getByRole('textbox', { name: 'Ask the store' })
		.fill('best deal for cooker-one-button');
	await dock.getByRole('button', { name: 'Send' }).click();
	const log = dock.getByRole('log');
	await expect(log.getByText('best deal for cooker-one-button')).toBeVisible();
	await expect(log.getByText('Offline mode')).toBeVisible();
	await expect(log.getByRole('link').first()).toHaveAttribute('href', /[?&]view=receipt(?:&|$)/);
	await expect(log.locator('[data-deal-fact="total"]')).toHaveAttribute('data-raw', '585');
	await page.getByRole('link', { name: 'Compare views', exact: true }).click();
	await page.getByRole('link', { name: 'Back to the store' }).click();
	await expect(log.locator('[data-deal-fact="total"]')).toHaveAttribute('data-raw', '585');
});

test('opens the phone chat, follows a journey suggestion and returns focus to the launcher', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/?view=receipt');
	await page.getByRole('button', { name: 'Chat with the assistant' }).click();
	const sheet = page.getByRole('dialog');
	await expect(sheet.getByRole('textbox', { name: 'Ask the store' })).toBeFocused();
	await sheet.getByRole('button', { name: 'ซื้อของขวัญให้แม่ หม้อหุงข้าว ใช้ง่ายๆ' }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'large');
	await expect(sheet.getByRole('log')).toContainText('ซื้อของขวัญให้แม่ หม้อหุงข้าว ใช้ง่ายๆ');
	await expect(sheet.getByRole('textbox', { name: 'ถามหน้าร้าน' })).toBeVisible();
	await expect(sheet.getByRole('log').getByText('ธีม · มาตรฐาน → ตัวอักษรใหญ่')).toBeVisible();
	await page.keyboard.press('Escape');
	const launcher = page.getByRole('button', { name: 'แชตกับผู้ช่วย' });
	await expect(launcher).toBeFocused();
	await page.getByRole('button', { name: 'ย้อนกลับ' }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'standard');
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a copied Thai citation opens the matching listing and returns to the receipt storefront', async ({
	page
}) => {
	await page.goto('/?view=receipt');
	const dock = page.getByRole('complementary', { name: 'Chat with the assistant' });
	await dock.getByRole('textbox', { name: 'Ask the store' }).fill('cooker-one-button ความจุเท่าไหร่');
	await dock.getByRole('button', { name: 'Send' }).click();
	const citation = dock.getByRole('link', { name: '1.8 ลิตร' });
	await expect(citation).toBeVisible();
	const href = await citation.getAttribute('href');
	if (!href) throw new Error('The listing citation has no destination');
	await page.goto(href);
	await expect(page.locator('main')).toHaveAttribute('lang', 'th');
	await page.getByRole('link', { name: 'กลับหน้าร้าน' }).click();
	await expect(page).toHaveURL(/\?view=receipt$/);
	await expect(page.getByRole('complementary')).toBeVisible();
});
