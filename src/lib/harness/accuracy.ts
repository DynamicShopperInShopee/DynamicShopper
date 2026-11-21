import type { GoldenCase, GoldenStart } from '../fixtures/golden-turns.ts';
import { findProduct, type CatalogPort } from './catalog-port.ts';
import { FORBIDDEN_REPLY } from './guard.ts';
import { activeCategory, mergePlan, standardPlan } from './plan.ts';
import { applyPatch, initialState } from './store.ts';
import { handleTurn, type HandledTurn, type RemoteAnswer, type TurnDeps } from './turn.ts';
import {
	CARD_FIELDS,
	DENSITIES,
	LANGUAGES,
	LAYOUTS,
	PRIORITIES,
	SECTIONS,
	THEMES,
	type Backend,
	type Plan,
	type StoreState
} from './types.ts';

/** Starting stores for golden cases. */
export function goldenState(start: GoldenStart, catalog: CatalogPort): StoreState {
	const base = initialState();
	const mice = { ...base, plan: mergePlan(standardPlan, { query: 'gaming mouse' }, catalog) };
	switch (start) {
		case 'standard':
			return base;
		case 'mice':
			return mice;
		case 'aero-focus':
			return { ...mice, focus: ['aero-x'] };
		case 'earbuds-focus':
			return {
				...base,
				plan: mergePlan(standardPlan, { filters: { category: 'earbuds' } }, catalog),
				focus: ['sportfit']
			};
		case 'anc-focus':
			return {
				...base,
				plan: mergePlan(standardPlan, { filters: { category: 'earbuds' } }, catalog),
				focus: ['quietbuds-pro']
			};
		case 'restyled':
			return applyPatch(base, { theme: 'minimal', layout: 'list' }, 'inferred', catalog).state;
	}
}

function planWithinAllowlists(plan: Plan): boolean {
	const has = (list: readonly unknown[], value: unknown) => list.includes(value);
	return (
		has(THEMES, plan.theme) &&
		has(LAYOUTS, plan.layout) &&
		has(DENSITIES, plan.density) &&
		has(LANGUAGES, plan.language) &&
		plan.cardFields.length > 0 &&
		plan.cardFields.every((field) => has(CARD_FIELDS, field)) &&
		plan.sections.every((section) => has(SECTIONS, section)) &&
		plan.sections.includes('products') &&
		PRIORITIES.every((key) => plan.priorities[key] >= 0 && plan.priorities[key] <= 1)
	);
}

/** The three safety checks run on every answer. Any failure is a fact violation. */
export function safetyViolations(result: HandledTurn, catalog: CatalogPort): string[] {
	const violations: string[] = [];
	if (FORBIDDEN_REPLY.test(result.turn.reply.text)) violations.push('fact_in_reply');
	if (!planWithinAllowlists(result.state.plan)) violations.push('plan_outside_allowlist');
	const ids = [
		...result.ranked.map((row) => row.product.id),
		...result.basket,
		...(result.turn.intent === 'ask' ? result.turn.citations.map((c) => c.productId) : []),
		...(result.turn.intent === 'find_deal' ? result.turn.productIds : [])
	];
	if (ids.some((id) => !findProduct(catalog, id))) violations.push('unknown_product');
	return violations;
}

function meetsExpectation(gold: GoldenCase, result: HandledTurn, catalog: CatalogPort): boolean {
	const want = gold.expect;
	if (!want) return true;
	if (result.turn.intent !== want.intent) return false;
	const plan = result.state.plan;
	if (want.theme && plan.theme !== want.theme) return false;
	if (want.layout && plan.layout !== want.layout) return false;
	if (want.density && plan.density !== want.density) return false;
	if (want.language && plan.language !== want.language) return false;
	if (want.category && activeCategory(catalog, plan) !== want.category) return false;
	if (want.maxPrice !== undefined && plan.filters.maxPrice !== want.maxPrice) return false;
	if (want.mallOnly !== undefined && plan.filters.mallOnly !== want.mallOnly) return false;
	if (want.firstSection && plan.sections[0] !== want.firstSection) return false;
	if (want.firstCardField && plan.cardFields[0] !== want.firstCardField) return false;
	for (const pref of want.specPrefs ?? [])
		if (!plan.specPrefs.some((p) => `${p.key}:${p.direction}` === pref)) return false;
	for (const key of want.priorities ?? [])
		if ((plan.priorities as Record<string, number>)[key] < 0.66) return false;
	return true;
}

export type GoldenRow = Readonly<{
	id: string;
	group: GoldenCase['group'];
	/** The backend that actually answered, not the one that was asked. */
	backend: Backend;
	pass: boolean;
	violations: readonly string[];
	dropped: number;
	guarded: boolean;
	ms: number;
}>;

export type GoldenSummary = Readonly<{
	backendAsked: Backend;
	total: number;
	/** Rows the asked backend genuinely answered. */
	answered: number;
	passed: number;
	accuracy: number | 'unavailable';
	violations: number;
	dropped: number;
	guarded: number;
	medianMs: number | null;
}>;

/** Model accuracy is only published when the model really answered most of the set. */
export const MODEL_ANSWER_FLOOR = 0.8;

/**
 * Run every golden message through the real pipeline. `answer` returns the server's answer for
 * a model run, or undefined for the keyword fallback. A model run that fell back is counted as
 * a fallback answer, never as a model result.
 */
export async function runGoldenSet(
	cases: readonly GoldenCase[],
	backendAsked: Backend,
	answer: (gold: GoldenCase, state: StoreState) => Promise<RemoteAnswer | undefined>,
	deps: TurnDeps
): Promise<{ rows: GoldenRow[]; summary: GoldenSummary }> {
	const rows: GoldenRow[] = [];
	for (const gold of cases) {
		const state = goldenState(gold.start, deps.catalog);
		const started = Date.now();
		const remote = backendAsked === 'model' ? await answer(gold, state) : undefined;
		const result = handleTurn(state, { message: gold.message, remote }, deps);
		const violations = safetyViolations(result, deps.catalog);
		const pass =
			violations.length === 0 &&
			(gold.group === 'adversarial' || meetsExpectation(gold, result, deps.catalog));
		rows.push({
			id: gold.id,
			group: gold.group,
			backend: result.backend,
			pass,
			violations,
			dropped: result.trace.dropped.length,
			guarded: result.trace.guard === 'replaced',
			ms: result.trace.ms || Date.now() - started
		});
	}
	const counted = rows.filter((row) => row.backend === backendAsked);
	const answered = counted.length;
	const passed = counted.filter((row) => row.pass).length;
	const genuine =
		backendAsked === 'offline' || answered / Math.max(1, rows.length) >= MODEL_ANSWER_FLOOR;
	const times = counted.map((row) => row.ms).sort((a, b) => a - b);
	return {
		rows,
		summary: {
			backendAsked,
			total: rows.length,
			answered,
			passed,
			accuracy: genuine && answered > 0 ? passed / answered : 'unavailable',
			violations: rows.reduce((sum, row) => sum + row.violations.length, 0),
			dropped: counted.reduce((sum, row) => sum + row.dropped, 0),
			guarded: counted.filter((row) => row.guarded).length,
			medianMs: times.length > 0 ? times[Math.floor(times.length / 2)] : null
		}
	};
}
