import { vouchers } from '../catalog';

export function watchPricingClock(openedAt: number, onTime: (now: number) => void): () => void {
	const expiryTimes = vouchers.map(({ expiresAfterMs }) => openedAt + expiresAfterMs);
	let timer: ReturnType<typeof setTimeout>;

	function refresh() {
		const now = Math.max(openedAt, Date.now());
		onTime(now);

		let delay = 60_000;
		for (const expiresAt of expiryTimes) {
			if (expiresAt > now) delay = Math.min(delay, expiresAt - now);
		}
		timer = setTimeout(refresh, delay);
	}

	function refreshOnVisibility() {
		if (document.visibilityState !== 'visible') return;
		clearTimeout(timer);
		refresh();
	}

	refresh();
	document.addEventListener('visibilitychange', refreshOnVisibility);
	return () => {
		clearTimeout(timer);
		document.removeEventListener('visibilitychange', refreshOnVisibility);
	};
}
