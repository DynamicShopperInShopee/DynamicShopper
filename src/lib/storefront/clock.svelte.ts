import type { PricingContext } from '../pricing';
import { watchPricingClock } from './live-quote';

export class PricingClock {
	context = $state.raw<PricingContext>();

	start() {
		const openedAt = Date.now();
		const stop = watchPricingClock(openedAt, (now) => {
			this.context = { openedAt, now: Math.max(this.context?.now ?? openedAt, now) };
		});
		return () => {
			stop();
			this.context = undefined;
		};
	}
}
