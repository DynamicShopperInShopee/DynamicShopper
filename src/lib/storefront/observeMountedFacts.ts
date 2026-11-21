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
	const roots = new Set(scopes.filter((scope) => scope !== undefined));
	const ancestors = new Set<HTMLElement>();
	for (const scope of roots) {
		observer.observe(scope, {
			attributes: true,
			characterData: true,
			childList: true,
			subtree: true
		});
		for (let parent = scope.parentElement; parent; parent = parent.parentElement) {
			if (!roots.has(parent)) ancestors.add(parent);
		}
	}
	for (const ancestor of ancestors) observer.observe(ancestor, { attributes: true });
	if (roots.size) window.addEventListener('resize', scheduleCheck);
	scheduleCheck();

	return () => {
		revision++;
		observer.disconnect();
		window.removeEventListener('resize', scheduleCheck);
	};
}
