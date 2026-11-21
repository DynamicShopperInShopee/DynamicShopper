import type { PricingContext } from '../pricing';

export class PricingClock {
	context = $state.raw<PricingContext>();

	start() {
		const openedAt = Date.now();
		this.context = { openedAt, now: openedAt };
		const timer = window.setInterval(() => {
			this.context = { openedAt, now: Math.max(this.context?.now ?? openedAt, Date.now()) };
		}, 60_000);
		return () => {
			window.clearInterval(timer);
			this.context = undefined;
		};
	}
}
