import type { ShopperPlan } from '../lib/personalization';
import type { Answers } from '../lib/personalization/interview';
import type { Sort } from '../lib/store-search';

export type ShelfCheckpoint = {
	plan: ShopperPlan;
	adapted: boolean;
	sort: Sort;
	freeShipping: boolean;
	capacity?: number;
	locks: (keyof ShopperPlan)[];
	interviewAnswers: Answers | null;
	interviewDirectOnly: boolean;
};

type InterviewVisit = {
	current: ShelfCheckpoint;
	undo: ShelfCheckpoint[];
	changes: (keyof ShopperPlan | 'capacityRemoved')[];
	draftQuery: string;
	search: string;
	scrollY: number;
};

// Only the opaque key enters browser history. The tab owns the validated plan and Undo history.
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
