import { defaultPlan, interpretOffline, type ShopperPlan } from '../personalization';
import { listings } from './shop-data';
import type { ShopListing } from '../catalog-api/types';
import {
	interviewProposal,
	sanitizeAnswers,
	type Answers,
	type Backend
} from '../personalization/interview';
export type View = {
	plan: ShopperPlan;
	order: 'catalog' | 'price-low' | 'price-high';
	category: string;
	page: number;
	languageLocked: boolean;
	themeLocked: boolean;
	interviewDirectOnly: boolean;
	interview: {
		answers: Answers;
		backend: Backend;
		before: ShopperPlan;
		beforeThemeLocked: boolean;
		applied: Partial<ShopperPlan>;
	} | null;
};
export const initialView = (): View => ({
	plan: { ...structuredClone(defaultPlan), locale: 'th', priorities: {} },
	order: 'catalog',
	category: 'all',
	page: 1,
	languageLocked: false,
	themeLocked: false,
	interviewDirectOnly: false,
	interview: null
});

export function resetView(state: View): View {
	const next = initialView();
	next.plan.locale = state.plan.locale;
	next.languageLocked = state.languageLocked;
	return next;
}

function rememberInterviewControls(
	state: View,
	answers: Answers,
	backend: Backend,
	directOnly: boolean,
	themeLocked: boolean
): View {
	const next = {
		...state,
		themeLocked,
		interviewDirectOnly: directOnly,
		interview: state.interview
			? { ...state.interview, answers, backend }
			: {
					answers,
					backend,
					before: structuredClone(state.plan),
					beforeThemeLocked: state.themeLocked,
					applied: {}
				}
	};
	return JSON.stringify(next) === JSON.stringify(state) ? state : next;
}

export function applyInterview(state: View, raw: unknown, directOnly = false): View {
	const answers = sanitizeAnswers(raw);
	// A new explicit reading answer can replace the lock created by the prior interview.
	const replaceReading =
		!!answers.reading &&
		answers.reading !== 'large' &&
		state.interview?.answers.reading === 'large' &&
		state.plan.theme === state.interview.applied.theme &&
		!state.interview.beforeThemeLocked;
	const inheritedLock = replaceReading ? false : state.themeLocked;
	const restoredTheme =
		replaceReading && state.plan.theme === 'large-print'
			? { theme: state.interview!.before.theme }
			: {};
	const result = interviewProposal(
		answers,
		{ ...state.plan, ...restoredTheme },
		{ directOnly, themeLocked: inheritedLock }
	);
	const patch = { ...restoredTheme, ...result.patch };
	const plan = { ...state.plan, ...patch };
	const themeLocked = inheritedLock || result.answers.reading === 'large';
	if (JSON.stringify(plan) === JSON.stringify(state.plan))
		return rememberInterviewControls(
			state,
			result.answers,
			result.backend,
			directOnly,
			themeLocked
		);
	return {
		...state,
		plan,
		themeLocked,
		interviewDirectOnly: directOnly,
		interview: {
			answers: result.answers,
			backend: result.backend,
			before: state.interview?.before ?? structuredClone(state.plan),
			beforeThemeLocked: state.interview?.beforeThemeLocked ?? state.themeLocked,
			applied: { ...state.interview?.applied, ...patch }
		}
	};
}

export function removeInterviewPreference(state: View, field: keyof ShopperPlan): View {
	const preference = state.interview;
	if (!preference || !(field in preference.applied)) return state;
	const applied = { ...preference.applied };
	const plan = { ...state.plan };
	// A later direct control owns its value; removing an old chip must not override it.
	if (JSON.stringify(plan[field]) === JSON.stringify(applied[field]))
		Object.assign(plan, { [field]: structuredClone(preference.before[field]) });
	delete applied[field];
	const answers = { ...preference.answers };
	if (field === 'layout' || field === 'sections') delete answers.goal;
	if (field === 'details') delete answers.evidence;
	if (field === 'priorities') delete answers.priority;
	if (field === 'density' || field === 'theme') delete answers.reading;
	return {
		...state,
		plan,
		themeLocked: field === 'theme' ? preference.beforeThemeLocked : state.themeLocked,
		interview: Object.keys(applied).length ? { ...preference, answers, applied } : null
	};
}
export function visibleListings(
	state: View,
	query: string,
	catalog: readonly ShopListing[] = listings
) {
	const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
	return catalog
		.filter(
			(p) =>
				(state.category === 'all' || state.category === p.category) &&
				words.every((w) => `${p.name.en} ${p.name.th}`.toLowerCase().includes(w)) &&
				(state.plan.maxPrice === null || (p.price !== null && p.price <= state.plan.maxPrice))
		)
		.slice()
		.sort((a, b) => {
			if (state.order === 'catalog' && !state.plan.priorities.price) return 0;
			if (a.price === null) return b.price === null ? a.id.localeCompare(b.id) : 1;
			if (b.price === null) return -1;
			return (
				(state.order === 'price-high' ? b.price - a.price : a.price - b.price) ||
				a.id.localeCompare(b.id)
			);
		});
}
// Bridge existing PR #4 presentation semantics to sourced listings. Never give the
// legacy synthetic catalog a real product ID or reuse its product/deal references.
export function interpret(message: string, state: View): { state: View; intent: string } {
	const turn = interpretOffline(message, state.plan);
	if (turn.intent !== 'change') return { state, intent: turn.intent };
	const { theme, layout, density, locale, maxPrice, simplified, sections } = turn.patch;
	const presentation = { theme, layout, density, locale, maxPrice, simplified, sections };
	const patch = Object.fromEntries(Object.entries(presentation).filter(([, v]) => v !== undefined));
	if (state.languageLocked && !/ภาษาไทย|ภาษาอังกฤษ|in english|in thai/i.test(message))
		delete patch.locale;
	if (/\bmom\b|แม่/i.test(message)) {
		if (state.themeLocked) delete patch.theme;
		for (const key of Object.keys(state.interview?.applied ?? {})) delete patch[key];
	}
	return { state: { ...state, plan: { ...state.plan, ...patch } }, intent: 'change' };
}
