import { expect, test } from '@playwright/test';
import { defaultPlan } from '../personalization/plan';
import { optimizeDeal } from '../pricing';

const basket = [{ productId: 'cooker-one-button', quantity: 2 }];
const hour = 60 * 60 * 1000;
const openedAt = Date.UTC(2026, 0, 18, 0);
const beforeExpiry = optimizeDeal(basket, { openedAt, now: openedAt })!;
const afterExpiry = optimizeDeal(basket, { openedAt, now: openedAt + 12 * hour })!;

for (const surface of ['card', 'cart', 'listing', 'section'] as const) {
	test(`the open ${surface} receipt reprices at voucher expiry and preserves the chat quote`, async ({
		page
	}) => {
		expect(beforeExpiry.appliedVouchers.map((offer) => offer.code)).toContain('MEGA8');
		expect(afterExpiry.unusedVouchers.find((offer) => offer.code === 'MEGA8')?.reason).toBe(
			'expired'
		);
		expect(afterExpiry.total).not.toBe(beforeExpiry.total);
		await page.clock.install({ time: openedAt });
		await page.clock.pauseAt(openedAt + 1000);
		await page.addInitScript(
			(saved) => localStorage.setItem('dynamicshopper.store.v1', JSON.stringify(saved)),
			{
				cart: basket,
				plan: {
					...defaultPlan,
					query: 'one-button',
					category: 'rice-cooker',
					details: ['price', 'vouchers'],
					sections: ['best-deal', 'products']
				}
			}
		);
		await page.goto('/?view=receipt');
		const input = page.getByRole('textbox', { name: 'Ask the store' });
		await expect(input).toBeEnabled();
		await input.fill('best deal for cooker-one-button');
		await input.press('Enter');
		const historical = page.getByRole('log').locator('.receipt');
		const total = '[data-deal-fact="total"]';
		await expect(historical.locator(total)).toHaveAttribute('data-raw', String(beforeExpiry.total));
		const original = await historical.textContent();
		const card = page.locator('[data-product-card="cooker-one-button"]');
		const cardVoucher = card.locator('[data-field="voucher.code"]').filter({ hasText: 'MEGA8' });
		await expect(cardVoucher).toBeVisible();
		if (surface === 'cart') {
			await page.getByRole('button', { name: 'Cart', exact: true }).click();
			await page.getByRole('button', { name: 'Best price for my cart' }).click();
		} else if (surface === 'card') {
			await card.getByRole('button', { name: 'Best price', exact: true }).click();
		} else if (surface === 'listing') {
			await page.clock.fastForward(12 * hour - 60_000);
			await card.locator('a[href*="/product/"]').first().click();
			await expect
				.poll(async () => {
					await page.clock.runFor(32);
					return page.locator('main').getAttribute('data-product');
				})
				.toBe('cooker-one-button');
			await page.getByRole('button', { name: 'Best price', exact: true }).click();
		}
		const active = page.locator(
			surface === 'section' ? '.sections .receipt' : 'main .quote .receipt'
		);
		await expect(active.locator(total)).toHaveAttribute('data-raw', String(beforeExpiry.total));
		if (surface !== 'listing') await page.clock.fastForward(12 * hour - 60_000);
		await expect(active.locator(total)).toHaveAttribute('data-raw', String(beforeExpiry.total));
		await page.clock.fastForward(60_000);
		await expect(active.locator(total)).toHaveAttribute('data-raw', String(afterExpiry.total));
		await expect(active.getByText('MEGA8 · Expired')).toHaveCount(1);
		await expect(historical).toHaveText(original ?? '');
		if (surface !== 'listing') await expect(cardVoucher).toHaveCount(0);
	});
}
