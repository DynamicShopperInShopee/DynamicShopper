import { expect, it, vi } from 'vitest';
import { PricingClock } from './clock.svelte';
import { quoteBasket } from './quoteBasket';

it('starts time-dependent pricing on mount, timestamps a quote once and releases the minute timer', () => {
	vi.useFakeTimers();
	try {
		const clock = new PricingClock();
		const otherSession = new PricingClock();
		const basket = [{ productId: 'cooker-one-button', quantity: 2 }];
		const start = Date.UTC(2026, 0, 18);
		vi.setSystemTime(start);
		expect(quoteBasket(basket, 'en', clock.context)).toBeUndefined();
		const stop = clock.start();
		const first = quoteBasket(basket, 'en', clock.context);
		expect(first?.quotedAt).toBe(start);
		vi.advanceTimersByTime(60_000);
		expect(clock.context).toEqual({ openedAt: start, now: start + 60_000 });
		expect(first?.quotedAt).toBe(start);
		expect(otherSession.context).toBeUndefined();
		stop();
		vi.advanceTimersByTime(60_000);
		expect(clock.context).toBeUndefined();
	} finally {
		vi.useRealTimers();
	}
});
