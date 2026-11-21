import { expect, test, type Page } from '@playwright/test';

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

async function holdCartWrite(page: Page) {
	await page.evaluate(
		() =>
			new Promise<void>((held) => {
				void navigator.locks.request(
					'dynamicshopper.store.v1',
					() =>
						new Promise<void>((release) => {
							window.addEventListener('release-cart-write', () => release(), { once: true });
							held();
						})
				);
			})
	);
	const add = page.getByRole('button', { name: /^Add to cart/ }).first();
	await add.click();
	await expect(add).toBeDisabled();
}

test('a direct filter supersedes a chat waiting for the cart', async ({ page }) => {
	await page.goto('/?view=receipt');
	const input = page.getByRole('textbox', { name: 'Ask the store' });
	await expect(input).toBeEnabled();
	await holdCartWrite(page);
	await input.fill('minimal and compact');
	await input.press('Enter');
	await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled();
	await input.press('Enter');
	await page.getByRole('button', { name: 'Filters', exact: true }).click();
	await page.getByRole('checkbox', { name: 'Free shipping only' }).check();
	await page.getByRole('button', { name: 'Apply filters' }).click();
	await page.evaluate(() => window.dispatchEvent(new Event('release-cart-write')));
	await page.evaluate(() => navigator.locks.request('dynamicshopper.store.v1', () => undefined));
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'standard');
	await expect(input).toHaveValue('minimal and compact');
	await expect(page.getByRole('log').getByText('minimal and compact', { exact: true })).toHaveCount(
		0
	);
});

test('a card quote waiting for the cart cannot follow the shopper back from the event page', async ({
	page
}) => {
	await page.goto('/?view=receipt');
	await expect(page.getByRole('textbox', { name: 'Ask the store' })).toBeEnabled();
	await holdCartWrite(page);
	await page.getByRole('button', { name: 'Best price', exact: true }).first().click();
	await page.getByRole('link', { name: 'DynamicShopper', exact: true }).click();
	await expect(page.locator('.event-demo')).toBeVisible();
	await page.evaluate(() => window.dispatchEvent(new Event('release-cart-write')));
	await page.getByRole('link', { name: 'Shopping assistant', exact: true }).click();
	await expect(page.getByRole('textbox', { name: 'Ask the store' })).toBeEnabled();
	await expect(page.locator('.quote')).toHaveCount(0);
});

test('the assistant keeps active Legacy cooker controls and their undo history', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/?view=receipt');
	const search = page.getByRole('searchbox');
	await search.fill('gaming mouse');
	await search.press('Enter');
	await expect
		.poll(() =>
			page.evaluate(() => {
				const saved = JSON.parse(localStorage.getItem('dynamicshopper.store.v1') ?? '{}') as {
					plan?: { query?: string };
				};
				return saved.plan?.query;
			})
		)
		.toBe('gaming mouse');

	await page.goto('/');
	await search.fill('rice cooker');
	await search.press('Enter');
	const filters = page.getByRole('navigation', { name: 'Rice cooker filters' });
	await filters.getByRole('button', { name: 'Free shipping', exact: true }).click();
	const sort = page.getByRole('combobox', { name: 'Sort by', exact: true });
	await sort.selectOption('top-sales');
	await filters.getByRole('link', { name: 'Shopping assistant', exact: true }).click();

	await expect(search).toHaveValue('rice cooker');
	await expect(sort).toHaveValue('top-sales');
	await page.getByRole('button', { name: 'Filters', exact: true }).click();
	await expect(
		page.getByRole('checkbox', { name: 'Free shipping only', exact: true })
	).toBeChecked();
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(search).toHaveValue('');
	await expect(sort).toHaveValue('default');
	await expect(
		page.getByRole('checkbox', { name: 'Free shipping only', exact: true })
	).not.toBeChecked();
});

test('the mobile Legacy cooker assistant link opens and focuses the chat sheet', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	const search = page.getByRole('searchbox');
	await search.fill('rice cooker');
	await search.press('Enter');
	const filters = page.getByRole('navigation', { name: 'Rice cooker filters' });
	await filters.getByRole('link', { name: 'Shopping assistant', exact: true }).click();

	const chat = page.getByRole('dialog', { name: 'Chat with the assistant' });
	await expect(chat.getByRole('textbox', { name: 'Ask the store' })).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(
		page.getByRole('button', { name: 'Chat with the assistant', exact: true })
	).toBeFocused();
	await expect(search).toHaveValue('rice cooker');
});
