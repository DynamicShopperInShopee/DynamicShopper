import { tick } from 'svelte';

export function observeMountedFacts<Result>(
	scopes: readonly (HTMLElement | undefined)[],
	check: () => Result,
	publish: (result: Result | undefined) => void
): () => void {
	let revision = 0;

	function scheduleCheck() {
		const scheduled = ++revision;
		publish(undefined);
		void tick().then(() => {
			if (scheduled === revision) publish(check());
		});
	}

	const observer = new MutationObserver(scheduleCheck);
	for (const scope of scopes) {
		if (scope) {
			observer.observe(scope, {
				attributes: true,
				characterData: true,
				childList: true,
				subtree: true
			});
		}
	}
	scheduleCheck();

	return () => {
		revision++;
		observer.disconnect();
	};
}
