import { expect, test } from '@playwright/test';
import { vouchers } from '../../../lib/catalog';
import { optimizeDeal } from '../../../lib/pricing';

test('refreshes an open product receipt at voucher expiry while offline', async ({
	page,
	context
}) => {
	const openedAt = Date.UTC(2026, 10, 21);
	const expiry = vouchers.find(({ code }) => code === 'MEGA8')!.expiresAfterMs;
	const basket = [{ productId: 'titan-max', quantity: 1 }];
	const before = optimizeDeal(basket, { openedAt, now: openedAt + expiry - 1 })!;
	const after = optimizeDeal(basket, { openedAt, now: openedAt + expiry })!;
	expect(after.total).toBeGreaterThan(before.total);

	await page.clock.install({ time: openedAt - 1000 });
	await page.clock.pauseAt(openedAt);
	await page.goto('/product/titan-max');
	const showDeal = page.getByRole('button', { name: 'Best price' });
	await expect(showDeal).toBeEnabled();
	await context.setOffline(true);
	await page.clock.fastForward(expiry - 1);
	await showDeal.dispatchEvent('click');

	const total = page.locator('[data-deal-fact="total"]');
	await expect(total).toHaveAttribute('data-raw', String(before.total));
	await expect(page.getByText('MEGA8 · Expires soon')).toBeVisible();
	await page.clock.runFor(1);
	await expect(total).toHaveAttribute('data-raw', String(after.total));
	await page.getByText('Unused vouchers').dispatchEvent('click');
	await expect(page.getByText('MEGA8 · Expired')).toBeVisible();
});
