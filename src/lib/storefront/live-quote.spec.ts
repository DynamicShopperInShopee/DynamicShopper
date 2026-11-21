import { afterEach, expect, it, vi } from 'vitest';
import { vouchers } from '../catalog';
import { optimizeDeal, type DealReceipt } from '../pricing';
import { watchPricingClock } from './live-quote';

afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

it('refreshes Titan Max at the exact voucher expiry and stops on cleanup', () => {
	vi.useFakeTimers();
	vi.stubGlobal('document', new EventTarget());
	const openedAt = Date.UTC(2026, 10, 21);
	const expiry = openedAt + vouchers.find(({ code }) => code === 'MEGA8')!.expiresAfterMs;
	vi.setSystemTime(expiry - 1);
	const receipts: (DealReceipt | null)[] = [];
	const quote = vi.fn((now: number) => {
		receipts.push(optimizeDeal([{ productId: 'titan-max', quantity: 1 }], { openedAt, now }));
	});
	const stop = watchPricingClock(openedAt, quote);

	expect(receipts[0]?.appliedVouchers).toEqual(
		expect.arrayContaining([expect.objectContaining({ code: 'MEGA8' })])
	);
	vi.advanceTimersByTime(1);
	expect(quote).toHaveBeenLastCalledWith(expiry);
	expect(receipts[1]?.unusedVouchers).toEqual(
		expect.arrayContaining([expect.objectContaining({ code: 'MEGA8', reason: 'expired' })])
	);
	expect(receipts[1]!.total).toBeGreaterThan(receipts[0]!.total);
	stop();
	vi.advanceTimersByTime(60_000);
	expect(quote).toHaveBeenCalledTimes(2);
});

it('refreshes immediately when a hidden page becomes visible', () => {
	vi.useFakeTimers();
	const tab = Object.assign(new EventTarget(), { visibilityState: 'hidden' });
	vi.stubGlobal('document', tab);
	const openedAt = Date.UTC(2026, 10, 21);
	vi.setSystemTime(openedAt);
	const onTime = vi.fn();
	const stop = watchPricingClock(openedAt, onTime);

	const resumedAt = openedAt + 1000;
	vi.setSystemTime(resumedAt);
	tab.dispatchEvent(new Event('visibilitychange'));
	expect(onTime).toHaveBeenCalledTimes(1);
	tab.visibilityState = 'visible';
	tab.dispatchEvent(new Event('visibilitychange'));
	expect(onTime).toHaveBeenLastCalledWith(resumedAt);
	expect(vi.getTimerCount()).toBe(1);
	stop();
	expect(vi.getTimerCount()).toBe(0);
});
