import { expect, test } from '@playwright/test';
import { personaPlan } from '../personalization/plan';

const cooker = '/product/cooker-one-button';
const receipt = cooker + '?view=receipt';
const sections = ['summary', 'specs', 'reviews'];

function look(details: string[]) {
	return Buffer.from(JSON.stringify({ details })).toString('base64url');
}

test('uses the tech storefront plan for the receipt listing', async ({ page }) => {
	await page.goto('/?view=receipt');
	await page.getByRole('button', { name: 'Tech minimal', exact: true }).click();
	const link = page.locator('a[href*="/product/"][href*="view=receipt"]').first();
	await link.click();
	await expect(page.locator('[data-listing-section]')).toHaveCount(3);
	expect(
		await page
			.locator('[data-listing-section]')
			.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-listing-section')))
	).toEqual(['specs', 'summary', 'reviews']);
});

test('takes the copied URL order over a conflicting visit and preserves fact proof', async ({
	page
}) => {
	await page.goto('/?view=receipt');
	await page.getByRole('button', { name: 'Tech minimal', exact: true }).click();
	const href = receipt + '&look=' + look(['reviews', 'specs', 'summary']) + '&lang=th&theme=large';
	await page.evaluate((href) => {
		const link = document.createElement('a');
		link.href = href;
		link.textContent = 'Open copied listing';
		document.body.prepend(link);
	}, href);
	await page.getByRole('link', { name: 'Open copied listing' }).click();
	await expect(page.locator('[data-listing-section]')).toHaveCount(3);
	expect(
		await page
			.locator('[data-listing-section]')
			.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-listing-section')))
	).toEqual(['reviews', 'specs', 'summary']);
	await expect(page.locator('main')).toHaveAttribute('lang', 'th');
	await expect(page.locator('main > [data-proof]')).toHaveAttribute('data-proof', 'verified');
});

test('uses the explicit visual details order from a copied listing', async ({ page }) => {
	await page.goto(receipt + '&look=' + look(personaPlan('visual').details));
	await expect(page.locator('[data-listing-section]')).toHaveCount(3);
	expect(
		await page
			.locator('[data-listing-section]')
			.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-listing-section')))
	).toEqual(['summary', 'reviews', 'specs']);
});

test('uses defaults for unusable receipt looks and keeps the legacy listing order', async ({
	page
}) => {
	for (const token of [look(['invented']), 'a'.repeat(4097)]) {
		await page.goto(receipt + '&look=' + token);
		await expect(page.locator('[data-listing-section]')).toHaveCount(3);
		expect(
			await page
				.locator('[data-listing-section]')
				.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-listing-section')))
		).toEqual(sections);
	}
	await page.goto(cooker + '?look=' + look(['specs']));
	await expect(page.locator('[data-listing-section]')).toHaveCount(0);
	await expect(
		page.locator('#reviews ~ #details .text-summary[data-fact="summary"]')
	).toBeVisible();
});

test('real comparison links use their pane orders and preserve the store undo step', async ({
	page
}) => {
	await page.goto('/?view=receipt');
	await page.getByRole('button', { name: 'Mom mode', exact: true }).click();
	await page.locator('a[href^="/compare?"]').click();
	const panes = page.locator('.panes > .pane');
	for (const [index, order] of [
		[0, ['specs', 'summary', 'reviews']],
		[1, ['summary', 'reviews', 'specs']]
	] as const) {
		await panes.nth(index).locator('a[href*="/product/"]').first().click();
		await expect
			.poll(() =>
				page
					.locator('[data-listing-section]')
					.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-listing-section')))
			)
			.toEqual(order);
		await page.goBack();
	}
	await page.locator('main header a[href^="/?"]').click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'large');
	await page.getByRole('button', { name: 'ย้อนกลับ', exact: true }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'standard');
});

test('real shelf links follow presentation changes from a shared store and preserve Undo', async ({
	page
}) => {
	await page.goto('/?view=receipt&look=' + look(['specs', 'reviews', 'summary']));
	await page.getByRole('button', { name: 'Visual vibrant', exact: true }).click();
	const link = page.locator('#products a[href*="/product/"]').first();
	await link.click();
	await expect
		.poll(() =>
			page
				.locator('[data-listing-section]')
				.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-listing-section')))
		)
		.toEqual(['summary', 'reviews', 'specs']);
	await page.getByRole('link', { name: 'Back to store', exact: true }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'vibrant');
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.locator('.store')).toHaveAttribute('data-theme', 'standard');
	await link.click();
	await expect
		.poll(() =>
			page
				.locator('[data-listing-section]')
				.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-listing-section')))
		)
		.toEqual(['specs', 'reviews', 'summary']);
});

test('inline comparison links use their pane orders', async ({ page }) => {
	await page.goto('/?view=receipt');
	await page.getByRole('button', { name: 'Visual vibrant', exact: true }).click();
	await page.getByRole('button', { name: 'Compare views', exact: true }).click();
	for (const [index, order] of [
		[0, ['specs', 'summary', 'reviews']],
		[1, ['summary', 'specs', 'reviews']]
	] as const) {
		await page
			.locator('[data-compare-pane]')
			.nth(index)
			.locator('a[href*="/product/"]')
			.first()
			.click();
		await expect
			.poll(() =>
				page
					.locator('[data-listing-section]')
					.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-listing-section')))
			)
			.toEqual(order);
		await page.goBack();
		if (index === 0) await page.getByRole('button', { name: 'Compare views', exact: true }).click();
	}
});
