import type { CatalogPort } from './catalog-port.ts';
import { changedParts, mergePlan, normalizeSections, patchParts } from './plan.ts';
import { applyPatch, type Transition } from './store.ts';
import {
	SIGNAL_KINDS,
	type CardField,
	type Plan,
	type PlanPatch,
	type Priority,
	type Section,
	type Signal,
	type SignalKind,
	type StoreState,
	type Suggestion
} from './types.ts';

/** Repeated behaviour needed before a suggestion appears. One isolated action never redesigns. */
export const SUGGESTION_THRESHOLD = 3;
export const MAX_SIGNALS = 50;

const frontField = (plan: Plan, field: CardField): CardField[] => [
	field,
	...plan.cardFields.filter((item) => item !== field)
];
const frontSection = (plan: Plan, section: Section): Section[] =>
	normalizeSections([section, ...plan.sections.filter((item) => item !== section)]);

/** What each kind of repeated behaviour suggests. Only presentation, never facts or order. */
function suggestionPatch(kind: SignalKind, plan: Plan): PlanPatch {
	switch (kind) {
		case 'open_compare':
			return { layout: 'table' };
		case 'open_specs':
			return { cardFields: frontField(plan, 'specs') };
		case 'open_reviews':
			return { cardFields: frontField(plan, 'reviews') };
		case 'zoom_text':
			return { theme: 'large-print' };
		case 'sort_price':
			return { priorities: { price: 1 } };
		case 'open_deal':
			return { sections: frontSection(plan, 'best-deal') };
	}
}

function deriveSuggestions(state: StoreState, catalog: CatalogPort): Suggestion[] {
	const suggestions: Suggestion[] = [];
	for (const kind of SIGNAL_KINDS) {
		const evidence = state.signals.filter((signal) => signal.kind === kind).length;
		if (evidence < SUGGESTION_THRESHOLD || state.dismissed.includes(kind)) continue;
		const patch = suggestionPatch(kind, state.plan);
		// Never suggest changing what the shopper set directly, or something already true.
		if (patchParts(patch).some((part) => state.explicit.includes(part))) continue;
		if (changedParts(state.plan, mergePlan(state.plan, patch, catalog)).length === 0) continue;
		suggestions.push({ id: kind, patch, evidence });
	}
	return suggestions;
}

/** Record in-session behaviour. The plan never changes here; at most a suggestion appears. */
export function recordSignal(state: StoreState, signal: unknown, catalog: CatalogPort): StoreState {
	if (
		typeof signal !== 'object' ||
		signal === null ||
		!(SIGNAL_KINDS as readonly unknown[]).includes((signal as Signal).kind) ||
		!Number.isFinite((signal as Signal).at)
	)
		return state;
	const { kind, at } = signal as Signal;
	const next = { ...state, signals: [...state.signals, { kind, at }].slice(-MAX_SIGNALS) };
	return { ...next, suggestions: deriveSuggestions(next, catalog) };
}

/** The shopper tapped a suggestion: it applies as their own explicit, undoable choice. */
export function acceptSuggestion(
	state: StoreState,
	id: SignalKind,
	catalog: CatalogPort
): Transition {
	const offered = state.suggestions.some((item) => item.id === id);
	const suggestions = deriveSuggestions(state, catalog);
	const suggestion = offered ? suggestions.find((item) => item.id === id) : undefined;
	if (!suggestion)
		return { state: { ...state, suggestions }, before: state.plan, changed: [], dropped: [] };
	const result = applyPatch(state, suggestion.patch, 'explicit', catalog);
	const next = {
		...result.state,
		dismissed: [...result.state.dismissed, id],
		signals: result.state.signals.filter((signal) => signal.kind !== id)
	};
	return { ...result, state: { ...next, suggestions: deriveSuggestions(next, catalog) } };
}

export function dismissSuggestion(
	state: StoreState,
	id: SignalKind,
	catalog: CatalogPort
): StoreState {
	const next = { ...state, dismissed: [...new Set([...state.dismissed, id])] };
	return { ...next, suggestions: deriveSuggestions(next, catalog) };
}

export const INTERVIEW = {
	goal: ['compare', 'discover', 'quick', 'someone'],
	matters: ['price', 'quality', 'design', 'performance', 'ease', 'delivery'],
	detail: ['simple', 'balanced', 'detailed'],
	help: ['best-total', 'comparison', 'complete-set', 'refills', 'none'],
	access: ['larger-text', 'reduced-motion', 'standard']
} as const;
export type InterviewQuestion = keyof typeof INTERVIEW;
export type InterviewAnswers = Partial<{
	[Q in InterviewQuestion]: (typeof INTERVIEW)[Q][number];
}>;

/**
 * Turn the optional interview into one explicit patch. Unknown or skipped answers change nothing.
 * Answers with no matching section in the fixed library (complete-set, refills) are reported
 * as unsupported rather than invented. Reduced motion is a UI setting, not part of the plan.
 */
export function interviewPatch(raw: unknown): { patch: PlanPatch; unsupported: string[] } {
	const answers: Record<string, unknown> =
		typeof raw === 'object' && raw !== null ? { ...raw } : {};
	const pick = <Q extends InterviewQuestion>(question: Q) =>
		(INTERVIEW[question] as readonly unknown[]).includes(answers[question])
			? (answers[question] as (typeof INTERVIEW)[Q][number])
			: undefined;
	const patch: { -readonly [K in keyof PlanPatch]: PlanPatch[K] } = {};
	const sections: Section[] = [];
	const priorities: Partial<Record<Priority, number>> = {};
	const unsupported: string[] = [];

	switch (pick('goal')) {
		case 'compare':
			patch.layout = 'table';
			sections.push('what-matters');
			break;
		case 'discover':
			patch.theme = 'vibrant';
			patch.cardFields = ['image', 'price', 'summary', 'reviews'];
			sections.push('top-picks', 'reviews');
			break;
		case 'quick':
			patch.density = 'compact';
			patch.cardFields = ['image', 'price', 'shipping', 'rating'];
			break;
		case 'someone':
			patch.simplified = true;
			sections.push('top-picks', 'share');
			break;
	}
	switch (pick('matters')) {
		case 'price':
			Object.assign(priorities, { price: 1, value: 0.66 });
			break;
		case 'quality':
			Object.assign(priorities, { rating: 1, durability: 0.66 });
			break;
		case 'design':
			Object.assign(priorities, { design: 1 });
			break;
		case 'performance':
			Object.assign(priorities, { performance: 1 });
			break;
		case 'ease':
			Object.assign(priorities, { rating: 1 });
			break;
		case 'delivery':
			patch.cardFields = [
				...new Set([...(patch.cardFields ?? ['image', 'price']), 'shipping'])
			] as CardField[];
			break;
	}
	switch (pick('detail')) {
		case 'simple':
			patch.density = 'spacious';
			patch.cardFields = ['image', 'price', 'summary'];
			break;
		case 'detailed':
			patch.density = 'compact';
			patch.layout = 'table';
			break;
	}
	switch (pick('help')) {
		case 'best-total':
			sections.push('best-deal');
			break;
		case 'comparison':
			sections.push('compare');
			break;
		case 'complete-set':
		case 'refills':
			unsupported.push(pick('help') as string);
			break;
	}
	if (pick('access') === 'larger-text') patch.theme = 'large-print';
	if (Object.keys(priorities).length > 0) patch.priorities = priorities;
	if (sections.length > 0) patch.sections = normalizeSections(sections);
	return { patch, unsupported };
}
