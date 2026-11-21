import {
	defaultCatalog,
	standardPlan,
	mergePlan,
	validatePatch,
	rankProducts,
	explainRank,
	type Plan,
	type PlanPart,
	type StoreState,
	type HandledTurn
} from '#lib/harness/index.ts';
import type { ShopperPlan, Turn } from '#lib/personalization/index.ts';
import type { Product } from '#lib/catalog/index.ts';

export const partMap: Record<keyof ShopperPlan, PlanPart> = {
	theme: 'theme',
	layout: 'layout',
	density: 'density',
	locale: 'language',
	details: 'cardFields',
	highlightedSpecs: 'highlightSpecs',
	query: 'query',
	category: 'filters.category',
	maxPrice: 'filters.maxPrice',
	shops: 'filters.shops',
	mallOnly: 'filters.mallOnly',
	simplified: 'simplified',
	sections: 'sections',
	priorities: 'priorities',
	specPreferences: 'specPrefs'
};
export function toHarness(plan: ShopperPlan): Plan {
	const raw = {
		theme: plan.theme,
		layout: plan.layout,
		density: plan.density,
		language: plan.locale,
		cardFields: plan.details,
		highlightSpecs: plan.highlightedSpecs,
		query: plan.query,
		filters: {
			category: plan.category,
			maxPrice: plan.maxPrice,
			shops: plan.shops,
			mallOnly: plan.mallOnly
		},
		simplified: plan.simplified,
		sections: plan.sections,
		priorities: plan.priorities,
		specPrefs: Object.entries(plan.specPreferences).map(([key, direction]) => ({ key, direction }))
	};
	const { specPrefs, highlightSpecs, ...base } = raw;
	const context = mergePlan(
		standardPlan,
		validatePatch(base, standardPlan, defaultCatalog, 'local').patch,
		defaultCatalog
	);
	return mergePlan(
		context,
		validatePatch({ specPrefs, highlightSpecs }, context, defaultCatalog, 'local').patch,
		defaultCatalog
	);
}
export function fromHarness(p: Plan): ShopperPlan {
	return {
		theme: p.theme,
		layout: p.layout,
		density: p.density,
		locale: p.language,
		details: [...p.cardFields],
		highlightedSpecs: [...p.highlightSpecs],
		query: p.query,
		category: p.filters.category,
		maxPrice: p.filters.maxPrice,
		shops: [...p.filters.shops],
		mallOnly: p.filters.mallOnly,
		simplified: p.simplified,
		sections: [...p.sections],
		priorities: { ...p.priorities },
		specPreferences: Object.fromEntries(p.specPrefs.map((s) => [s.key, s.direction]))
	};
}
export function websiteState(
	current: StoreState,
	plan: ShopperPlan,
	locks: (keyof ShopperPlan)[],
	history: { plan: ShopperPlan; locks: (keyof ShopperPlan)[] }[]
): StoreState {
	return {
		...current,
		plan: toHarness(plan),
		explicit: locks.map((key) => partMap[key]),
		undo: history.map((s) => ({
			plan: toHarness(s.plan),
			explicit: s.locks.map((k) => partMap[k])
		}))
	};
}
export function websiteTurn(result: HandledTurn): Turn {
	const turn = result.turn;
	return {
		intent: ['restyle', 'search', 'persona'].includes(turn.intent)
			? 'change'
			: turn.intent === 'find_deal'
				? 'deal'
				: (turn.intent as Turn['intent']),
		patch: {},
		reply: turn.reply.text,
		citations:
			turn.intent === 'ask'
				? turn.citations.map((c) => ({
						productId: c.productId,
						field:
							c.kind === 'spec'
								? `spec.${c.key}`
								: c.kind === 'review'
									? `review.${c.key}`
									: 'summary'
					}))
				: [],
		productIds: [...result.basket],
		dropped: result.trace.dropped.map((d) => `${d.place}: ${d.code}`),
		guarded: result.trace.guard === 'replaced'
	};
}
export function websiteRanking(products: readonly Product[], plan: ShopperPlan) {
	return rankProducts({ ...defaultCatalog, products }, toHarness(plan)).map((row) => ({
		...row,
		terms: row.terms.map((t) => ({ key: t.id.replace('spec:', ''), contribution: t.contribution })),
		bars: explainRank(row)
	}));
}
