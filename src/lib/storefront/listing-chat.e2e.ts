import { expect, test, type Page } from '@playwright/test';

async function holdCartWrite(page: Page) {
	await page.evaluate(
		() =>
			new Promise<void>((ready) => {
				void navigator.locks.request(
					'dynamicshopper.store.v1',
					() =>
						new Promise<void>((release) => {
							window.addEventListener('release-cart-write', () => release(), { once: true });
							ready();
						})
				);
			})
	);
}

test('answers about the open product offline and quotes its cart quantity', async ({
	page,
	context
}) => {
	await page.goto('/product/cooker-one-button?lang=en&theme=minimal&view=receipt');
	const chat = page.getByRole('complementary', { name: 'Chat with the assistant' });
	await expect(chat).toBeVisible();
	const input = chat.getByRole('textbox', { name: 'Ask the store' });
	await expect(input).toBeEnabled();
	await context.setOffline(true);
	await input.fill('What is the capacity?');
	await input.press('Enter');
	const log = chat.getByRole('log');
	await expect(log.getByRole('link', { name: '1.8 L', exact: true })).toHaveAttribute(
		'href',
		/\/product\/cooker-one-button\?.*view=receipt/
	);
	await expect(page.locator('main')).toHaveAttribute('data-theme', 'minimal');
	const add = page.getByRole('button', { name: /^Add to cart/ });
	await expect(page.getByRole('button', { name: 'Specifications', exact: true })).toBeEnabled();
	await add.click();
	await expect(page.getByText('Added to cart', { exact: true })).toBeVisible();
	await holdCartWrite(page);
	await add.click();
	await expect(add).toBeDisabled();
	await input.fill('cheapest way to get this?');
	await input.press('Enter');
	await expect(log.locator('[data-deal-fact="quantity"]')).toHaveCount(0);
	await page.evaluate(() => window.dispatchEvent(new Event('release-cart-write')));
	await expect(log.locator('[data-deal-fact="quantity"]')).toHaveAttribute('data-raw', '2');
	await page.getByRole('button', { name: 'Best price', exact: true }).click();
	const chatReceipt = log.locator('.receipt');
	await expect(chatReceipt.locator('[data-deal-fact="extraCost"]').first()).toBeVisible();
	await expect(page.locator('main .quote .receipt')).toHaveText(
		(await chatReceipt.textContent()) ?? ''
	);
});

test('uses the storefront undo stack once for a change requested on a listing', async ({
	page
}) => {
	await page.goto('/product/cooker-one-button?view=receipt');
	const input = page.getByRole('textbox', { name: 'Ask the store' });
	await input.fill('minimal and compact');
	await input.press('Enter');
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'minimal');
	await expect(page.getByRole('log').getByText('minimal and compact', { exact: true })).toHaveCount(
		1
	);
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'standard');
});

test('a category requested from a listing clears the incompatible shelf search offline', async ({
	page,
	context
}) => {
	await page.goto('/?view=receipt');
	const search = page.getByRole('searchbox');
	await expect(search).toBeEnabled();
	await search.fill('gaming mouse');
	await search.press('Enter');
	await page.locator('#products [data-product-card="aero-x"]').getByRole('link').press('Enter');
	await expect(page).toHaveURL(/\/product\/mouse-3\?/);
	const input = page.getByRole('textbox', { name: 'Ask the store' });
	await expect(input).toBeEnabled();
	await context.setOffline(true);
	await input.fill('Show me rice cookers');
	await input.press('Enter');
	await expect(page.locator('#products [data-product-card="cooker-one-button"]')).toBeVisible();
	await expect(search).toHaveValue('');
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(search).toHaveValue('gaming mouse');
});

test.describe('before listing hydration', () => {
	test.use({ javaScriptEnabled: false });
	test('keeps native links available and the script-controlled specifications sheet disabled', async ({
		page
	}) => {
		await page.goto('/product/cooker-one-button?view=receipt');
		await expect(page.getByRole('button', { name: 'Specifications', exact: true })).toBeDisabled();
		await expect(page.getByRole('link', { name: 'Back to store', exact: true })).toBeVisible();
	});
});

test('a copied receipt listing preserves a validated look in seller, language and return links', async ({
	page
}) => {
	const token = Buffer.from(JSON.stringify({ theme: 'minimal', density: 'compact' })).toString(
		'base64url'
	);
	await page.goto('/product/cooker-one-button?view=receipt&look=' + token);
	const receiptQuery = 'view=receipt&look=' + token;
	const back = page.getByRole('link', { name: 'Back to store', exact: true });
	await expect(back).toHaveAttribute('href', '/?' + receiptQuery);
	await expect(page.getByRole('link', { name: 'ไทย', exact: true })).toHaveAttribute(
		'href',
		new RegExp(receiptQuery + '$')
	);
	await expect(
		page.locator('section[aria-labelledby="seller-name"]').getByRole('link').first()
	).toHaveAttribute('href', new RegExp(receiptQuery + '$'));
	await back.click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'minimal');
	await expect(page.locator('.store')).toHaveAttribute('data-density', 'compact');
});

test('a cart quote cannot open on another listing while an add is saving', async ({ page }) => {
	await page.goto('/product/cooker-one-button?view=receipt');
	const add = page.getByRole('button', { name: /^Add to cart/ });
	await expect(page.getByRole('button', { name: 'Specifications', exact: true })).toBeEnabled();
	await add.click();
	await expect(page.getByText('Added to cart', { exact: true })).toBeVisible();
	await holdCartWrite(page);
	await add.click();
	await expect(add).toBeDisabled();
	await page.getByRole('button', { name: 'Cart', exact: true }).click();
	await page.getByRole('button', { name: 'Best price for my cart' }).click();
	await page.locator('section[aria-labelledby="seller-name"]').getByRole('link').first().click();
	await expect(page.locator('main')).not.toHaveAttribute('data-product', 'cooker-one-button');
	await page.evaluate(() => window.dispatchEvent(new Event('release-cart-write')));
	await page.evaluate(() => navigator.locks.request('dynamicshopper.store.v1', () => undefined));
	await expect(page.locator('section.quote')).toHaveCount(0);
});

test('a delayed chat quote is superseded across A to B to A and leaves a new quote pending', async ({
	page
}) => {
	await page.goto('/product/cooker-one-button?view=receipt');
	const input = page.getByRole('textbox', { name: 'Ask the store' });
	const add = page.getByRole('button', { name: /^Add to cart/ });
	const send = page.getByRole('button', { name: 'Send', exact: true });
	const log = page.getByRole('log');
	await expect(input).toBeEnabled();
	await holdCartWrite(page);
	await add.click();
	await input.fill('best deal for this');
	await input.press('Enter');
	await expect(page.getByText('Checking the price…')).toBeVisible();
	await page.locator('section[aria-labelledby="seller-name"]').getByRole('link').first().click();
	await expect(page.locator('main')).not.toHaveAttribute('data-product', 'cooker-one-button');
	await input.fill('What is the capacity?');
	await input.press('Enter');
	await page.goBack();
	await expect(page.locator('main')).toHaveAttribute('data-product', 'cooker-one-button');

	// The first write can complete independently while the second quote still waits for its write.
	await page.evaluate(() => {
		void navigator.locks.request(
			'dynamicshopper.store.v1',
			() =>
				new Promise<void>((release) => {
					window.addEventListener('release-next-write', () => release(), { once: true });
					window.dispatchEvent(new Event('next-cart-lock-held'));
				})
		);
	});
	await add.click();
	await input.fill('cheapest way to get this?');
	await input.press('Enter');
	await page.evaluate(
		() =>
			new Promise<void>((held) => {
				window.addEventListener('next-cart-lock-held', () => held(), { once: true });
				window.dispatchEvent(new Event('release-cart-write'));
			})
	);
	await expect(log.getByText('best deal for this', { exact: true })).toHaveCount(0);
	await expect(page.getByText('Checking the price…')).toBeVisible();
	await expect(send).toBeDisabled();
	await page.evaluate(() => window.dispatchEvent(new Event('release-next-write')));
	await expect(log.getByText('cheapest way to get this?', { exact: true })).toHaveCount(1);
	await expect(log.getByText('best deal for this', { exact: true })).toHaveCount(0);
	await expect(log.getByText('What is the capacity?', { exact: true })).toHaveCount(1);
	await expect(log.locator('[data-deal-fact="quantity"]')).toHaveAttribute('data-raw', '2');
});

test('changing only the listing language supersedes its pending chat quote', async ({ page }) => {
	await page.goto('/product/cooker-one-button?view=receipt');
	const input = page.getByRole('textbox', { name: 'Ask the store' });
	await expect(input).toBeEnabled();
	await holdCartWrite(page);
	await page.getByRole('button', { name: /^Add to cart/ }).click();
	await input.fill('best deal for this');
	await input.press('Enter');
	await expect(page.getByText('Checking the price…')).toBeVisible();
	await page.getByRole('link', { name: 'ไทย', exact: true }).click();
	await expect(page.locator('main')).toHaveAttribute('lang', 'th');
	await page.evaluate(() => window.dispatchEvent(new Event('release-cart-write')));
	await page.evaluate(() => navigator.locks.request('dynamicshopper.store.v1', () => undefined));
	await expect(page.getByRole('log').locator('[data-deal-fact]')).toHaveCount(0);
	await expect(page.getByRole('alert')).toHaveCount(0);
});
