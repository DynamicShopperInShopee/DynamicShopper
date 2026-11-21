import type { StoreVisitState } from '../lib/storefront/store.svelte';

type InterviewVisit = {
	current: StoreVisitState;
	search: '' | `?${string}`;
	scrollY: number;
};

// Only the opaque key enters browser history. The visit state stays in this tab.
const visits = new Map<string, InterviewVisit>();

export function saveInterviewVisit(visit: InterviewVisit) {
	const key = crypto.randomUUID();
	visits.set(key, visit);
	if (visits.size > 40) {
		const oldest = visits.keys().next();
		if (!oldest.done) visits.delete(oldest.value);
	}
	return key;
}

export function readInterviewVisit(key: unknown) {
	return typeof key === 'string' ? visits.get(key) : undefined;
}
