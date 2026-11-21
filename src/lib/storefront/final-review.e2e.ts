import { expect, test, type Page } from '@playwright/test';
import { defaultPlan } from '../personalization/plan';

const store = '/?view=receipt';
const listing = '/product/cooker-one-button?view=receipt';

test.use({ viewport: { width: 1440, height: 900 } });

async function send(page: Page, text: string) {
	const input = page.getByRole('textbox', { name: 'Ask the store' });
	await input.fill(text);
	await input.press('Enter');
}

for (const route of [store, listing]) {
	test(`checks the visible cart copy on ${route} and rechecks when the popover closes`, async ({
		page
	}) => {
		await page.goto(route);
		const proof =
			route === store
				? page.locator('#products [data-proof]')
				: page.locator('main > [data-proof]');
		const count = proof.locator('[data-fact="checkedCount"]');
		await expect(proof).toHaveAttribute('data-proof', 'verified');
		await page
			.getByRole('button', { name: /^Add to cart/ })
			.first()
			.click();
		await expect(page.getByText('Added to cart', { exact: true })).toBeVisible();
		const before = Number(await count.textContent());

		await page.getByRole('button', { name: 'Cart', exact: true }).click();
		const cart = page.getByRole('region', { name: 'Cart', exact: true });
		const price = cart.locator('[data-field="price"]');
		await expect(price).toBeVisible();
		await expect(count).toHaveText(String(before + 2));
		await price.evaluate((node) => (node.textContent = '฿1'));
		await expect(proof).toHaveAttribute('data-proof', 'failed');
		await page.keyboard.press('Escape');
		await expect(cart).toBeHidden();
		await expect(proof).toHaveAttribute('data-proof', 'verified');
		await expect(count).toHaveText(String(before));
		await page.getByRole('button', { name: 'Cart', exact: true }).click();
		await expect(proof).toHaveAttribute('data-proof', 'failed');
	});

	test(`checks a Thai citation on the English page at ${route}`, async ({ page }) => {
		await page.goto(route);
		const proof =
			route === store
				? page.locator('#products [data-proof]')
				: page.locator('main > [data-proof]');
		const count = proof.locator('[data-fact="checkedCount"]');
		await expect(proof).toHaveAttribute('data-proof', 'verified');
		const before = Number(await count.textContent());
		await send(page, 'cooker-one-button ความจุเท่าไหร่');
		const row = page
			.getByRole('region', { name: 'จากรายการสินค้า' })
			.getByRole('link', { name: '1.8 ลิตร' });
		await expect(row).toBeVisible();
		await expect.poll(async () => Number(await count.textContent())).toBeGreaterThan(before);
		await expect(proof).toHaveAttribute('data-proof', 'verified');
		await row
			.locator('[data-field="spec.capacity"]')
			.evaluate((node) => (node.textContent = '1.8 L'));
		await expect(proof).toHaveAttribute('data-proof', 'failed');
	});
}

test('the offline mouse-to-Mom journey clears the locked search and keeps its explicit sort', async ({
	page
}) => {
	await page.goto(store);
	const search = page.getByRole('searchbox');
	await search.fill('gaming mouse');
	await search.press('Enter');
	await expect(page.locator('#products [data-proof]')).toHaveAttribute('data-proof', 'verified');
	await send(page, 'ขอแบบเรียบๆ ดูสเปกก่อน');
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'minimal');
	await send(page, 'I care about battery and light weight, under 1500 baht');
	const table = page.locator('#products table');
	await expect(table.locator('tbody tr')).toHaveCount(3);
	await expect(table.locator('tbody tr').first()).toContainText('Aero X');
	await table.getByText('Why this order?', { exact: true }).first().click();
	await send(page, 'does the battery last all day?');
	await expect(page.getByRole('region', { name: 'From the listing', exact: true })).toBeVisible();
	await expect(search).toHaveValue('gaming mouse');
	await page.getByRole('combobox', { name: 'Sort by', exact: true }).selectOption('top-sales');
	await send(page, 'ซื้อของขวัญให้แม่ หม้อหุงข้าว ใช้ง่ายๆ');
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'large');
	await expect(search).toHaveValue('');
	await expect(page.locator('#products [data-product-card]')).toHaveCount(3);
	await expect(
		page.locator('#products [data-product-card][data-product-card^="cooker-"]')
	).toHaveCount(3);
	await expect(page.locator('.toolbar select')).toHaveValue('top-sales');
});

test('changing receipt category clears the submitted query and Undo restores both', async ({
	page
}) => {
	await page.goto(store);
	const search = page.getByRole('searchbox');
	await search.fill('gaming mouse');
	await search.press('Enter');
	await page.getByRole('button', { name: 'Rice cookers', exact: true }).click();
	await expect(search).toHaveValue('');
	await expect(page.locator('#products [data-product-card]')).toHaveCount(6);
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(search).toHaveValue('gaming mouse');
	await expect(page.getByRole('button', { name: 'All', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
});

test('explicit All products keeps its preferences when an offline turn names another category', async ({
	page,
	context
}) => {
	await page.addInitScript(
		(plan) => localStorage.setItem('dynamicshopper.store.v1', JSON.stringify({ plan })),
		{ ...defaultPlan, highlightedSpecs: ['weight'], specPreferences: { weight: 'lower' } }
	);
	await page.goto(store);
	const all = page.getByRole('button', { name: 'All', exact: true });
	const weight = page.getByRole('button', { name: 'Remove Weight · Prefer lower', exact: true });
	await expect(weight).toBeVisible();
	await all.click();
	await context.setOffline(true);
	await send(page, 'Show rice cookers with more capacity in a compact view');
	await expect(page.locator('.store')).toHaveAttribute('data-density', 'compact');
	await expect(all).toHaveAttribute('aria-pressed', 'true');
	await expect(weight).toBeVisible();
	await expect(page.getByRole('button', { name: 'Remove Capacity · Prefer higher' })).toHaveCount(
		0
	);
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-density', 'comfortable');
	await expect(weight).toBeVisible();
});

test('clearing incompatible saved shop filters recovers products and has one Undo', async ({
	page
}) => {
	await page.addInitScript(
		(plan) => localStorage.setItem('dynamicshopper.store.v1', JSON.stringify({ plan })),
		{
			...defaultPlan,
			theme: 'vibrant',
			layout: 'list',
			shops: ['gamerzone'],
			mallOnly: true
		}
	);
	await page.goto(store);
	const products = page.locator('#products');
	await expect(products.getByRole('heading', { name: 'No products match' })).toBeVisible();
	await expect(products.getByRole('list')).toContainText('GamerZone');
	await expect(products.getByRole('list')).toContainText('Mall only');
	const clear = products.getByRole('button', { name: 'Clear filters', exact: true });
	await clear.click();
	await expect(products.locator('[data-product-card]').first()).toBeVisible();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'vibrant');
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(products.getByRole('heading', { name: 'No products match' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
});

test('direct language and theme each own one Undo step', async ({ page }) => {
	await page.goto(store);
	const undo = page.getByRole('button', { name: 'Undo', exact: true });
	await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('vibrant');
	await expect(undo).toBeEnabled();
	await page.getByRole('button', { name: 'ไทย', exact: true }).click();
	await page.getByRole('button', { name: 'ย้อนกลับ', exact: true }).click();
	await expect(page.locator('.store')).toHaveAttribute('lang', 'en');
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'vibrant');
	await undo.click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'standard');
	await expect(undo).toBeDisabled();
});

test('sort and Clear filters record only effective direct changes', async ({ page }) => {
	await page.goto(store);
	const undo = page.getByRole('button', { name: 'Undo', exact: true });
	const sort = page.getByRole('combobox', { name: 'Sort by', exact: true });
	await expect(page.getByRole('button', { name: 'X-ray', exact: true })).toBeEnabled();
	await page.getByRole('button', { name: 'Filters', exact: true }).click();
	const clear = page.locator('#search-filters').getByRole('button', { name: 'Clear filters' });
	await clear.click();
	await expect(undo).toBeDisabled();
	const shipping = page.getByRole('checkbox', { name: 'Free shipping only' });
	await shipping.check();
	await page.getByRole('button', { name: 'Apply filters' }).click();
	await sort.selectOption('top-sales');
	await clear.click();
	await expect(shipping).not.toBeChecked();
	await undo.click();
	await expect(shipping).toBeChecked();
	await expect(sort).toHaveValue('top-sales');
	await undo.click();
	await expect(shipping).toBeChecked();
	await expect(sort).toHaveValue('default');
	await undo.click();
	await expect(shipping).not.toBeChecked();
	await expect(undo).toBeDisabled();
});

async function expectListingOrder(page: Page, order: string[]) {
	await expect
		.poll(() =>
			page
				.locator('[data-listing-section]')
				.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-listing-section')))
		)
		.toEqual(order);
}

test('a Thai citation from a fresh copied listing retains its reviews-first look', async ({
	page
}) => {
	const look = Buffer.from(JSON.stringify({ details: ['reviews', 'specs', 'summary'] })).toString(
		'base64url'
	);
	await page.goto(listing + '&look=' + look);
	const order = ['reviews', 'specs', 'summary'];
	await expectListingOrder(page, order);
	await send(page, 'ความจุเท่าไหร่');
	await page
		.getByRole('region', { name: 'จากรายการสินค้า' })
		.getByRole('link', { name: '1.8 ลิตร' })
		.click();
	await expect(page.locator('main')).toHaveAttribute('lang', 'th');
	await expectListingOrder(page, order);
});

test('a mentioned product link from a compare listing retains the pane look over the stored plan', async ({
	page
}) => {
	await page.goto(store);
	await page.getByRole('button', { name: 'Shopper views', exact: true }).click();
	await page.getByRole('button', { name: 'Visual vibrant', exact: true }).click();
	const search = page.getByRole('searchbox');
	await search.fill('rice cooker');
	await search.press('Enter');
	await page.getByRole('link', { name: 'Compare views', exact: true }).click();
	await page.locator('.panes > .pane').first().locator('a[href*="/product/"]').first().click();
	const order = ['specs', 'summary', 'reviews'];
	await expectListingOrder(page, order);
	const look = new URL(page.url()).searchParams.get('look');
	expect(look).toBeTruthy();
	const productId = page.url().includes('/cooker-one-button?')
		? 'cooker-steamer'
		: 'cooker-one-button';
	await send(page, `cheapest way to get ${productId}`);
	await page.getByRole('log').locator(`.mentioned a[href*="/${productId}?"]`).click();
	await expect(page).toHaveURL(
		(url) => url.pathname.endsWith('/' + productId) && url.searchParams.get('look') === look
	);
	await expectListingOrder(page, order);
});
