import type { LiveHint } from '#lib/personalization/live.ts';
import type { CatalogPort } from '#lib/harness/catalog-port.ts';
import { LEVEL_WEIGHT } from '#lib/harness/plan.ts';
import {
	CARD_FIELDS,
	DENSITIES,
	INTENTS,
	LANGUAGES,
	LAYOUTS,
	LEVELS,
	PERSONAS,
	PRIORITIES,
	SECTIONS,
	THEMES,
	type Level,
	type Plan,
	type Turn
} from '#lib/harness/types.ts';
import type { Listing } from './tools.ts';

const nearestLevel = (weight: number): Level =>
	LEVELS.reduce((best, level) =>
		Math.abs(LEVEL_WEIGHT[level] - weight) < Math.abs(LEVEL_WEIGHT[best] - weight) ? level : best
	);

/**
 * The instructions. Stable text built only from allowlists and catalog vocabulary: no prices,
 * no shopper data. Products are listed as names, categories and tags.
 */
export function systemPrompt(catalog: CatalogPort): string {
	const specLines = Object.entries(catalog.specs)
		.map(
			([category, list]) =>
				`- ${category}: ${list
					.map(
						(spec) =>
							`${spec.key}${spec.direction ? ` (numeric, ${spec.direction} is better)` : ' (words only)'}`
					)
					.join(', ')}`
		)
		.join('\n');
	const productLines = catalog.products
		.map(
			(product) =>
				`- ${product.id} | ${product.category} | ${product.name.en} | ${product.name.th} | ${product.tags.join(', ')}`
		)
		.join('\n');
	return `You are the shopping assistant inside DynamicShopper, a Thai and English storefront.
You may change how the store looks and what it shows. You can never state or change a fact.

Answer with one JSON object and nothing else:
{"intent": one of ${INTENTS.join(' | ')},
 "patch": optional plan change (only for restyle, search, persona),
 "persona": one of ${PERSONAS.join(' | ')} (only for persona),
 "productIds": optional product ids (only for find_deal),
 "citations": optional [{"productId", "kind": "spec" | "review" | "summary", "key"}] (only for ask),
 "reply": one short friendly sentence in the shopper's language}

Plan change fields (all optional):
- theme: ${THEMES.join(' | ')}
- layout: ${LAYOUTS.join(' | ')}
- density: ${DENSITIES.join(' | ')}
- language: ${LANGUAGES.join(' | ')}
- cardFields: ordered list from ${CARD_FIELDS.join(', ')}
- highlightSpecs: spec keys of the active category
- query: search words (no numbers)
- priorities: object with keys ${PRIORITIES.join(', ')} and values ${LEVELS.join(' | ')}
- specPrefs: [{"key": numeric spec key of the active category, "direction": "higher" | "lower"}]
- filters: {"category": category or null, "shops": shop ids, "mallOnly": true | false}
- simplified: true shows only three products
- sections: ordered list from ${SECTIONS.join(', ')}; products is always kept

Rules:
- Never write any digit, price, currency or amount in "reply". The store prints every fact itself.
- Never set a budget or price limit. The store reads budgets from the shopper's own words.
- A question never changes the store: use intent "ask" and cite only products you read this turn. If the listing cannot answer, cite nothing.
- "Undo", "start over" and similar are store commands: use intent "undo" or "reset" with no patch.
- A request for the cheapest way to buy something is "find_deal"; it never changes ranking.
- Use search_catalog and read_listing only for vague or multi-need requests or questions about products you have not read. Do not use tools for pure restyles, resets or undo.
- Persona "mom" means large print, Thai and three clear choices for an older parent.
- Use the supplied language. The request contains only recognized intent, presentation labels and catalog context.

Categories and spec keys:
${specLines}

Shops: ${catalog.shops.map((shop) => `${shop.id}${shop.mall ? ' (mall)' : ''}`).join(', ')}

Products (id | category | English name | Thai name | tags):
${productLines}`;
}

/** The shopper's plan as the model may see it: priorities as levels, the budget as a yes/no. */
export function projectPlan(plan: Plan) {
	return {
		theme: plan.theme,
		layout: plan.layout,
		density: plan.density,
		language: plan.language,
		cardFields: plan.cardFields,
		highlightSpecs: plan.highlightSpecs,
		priorities: Object.fromEntries(
			Object.entries(plan.priorities).map(([key, weight]) => [key, nearestLevel(weight)])
		),
		specPrefs: plan.specPrefs,
		filters: {
			category: plan.filters.category,
			shops: plan.filters.shops,
			mallOnly: plan.filters.mallOnly,
			hasBudget: plan.filters.maxPrice !== null
		},
		simplified: plan.simplified,
		sections: plan.sections
	};
}

/** The provider sees finite request labels and catalog context. Free text stays local. */
export function userContext(input: {
	requestTurn: Turn;
	presentationHints: readonly LiveHint[];
	language: Plan['language'];
	plan: Plan;
	focus: readonly Listing[];
	cart: readonly string[];
	viewed: readonly string[];
	hasBudget: boolean;
}): string {
	const { requestTurn } = input;
	const request: Record<string, unknown> = { intent: requestTurn.intent };
	if (requestTurn.intent === 'persona') request.persona = requestTurn.persona;
	if ('patch' in requestTurn) {
		const {
			theme,
			layout,
			density,
			language,
			cardFields,
			highlightSpecs,
			specPrefs,
			simplified,
			sections,
			filters,
			priorities
		} = requestTurn.patch;
		request.presentation = {
			theme,
			layout,
			density,
			language,
			cardFields,
			highlightSpecs,
			specPrefs,
			simplified,
			sections,
			category: filters?.category,
			mallOnly: filters?.mallOnly,
			priorities: priorities && Object.keys(priorities)
		};
	}
	if (requestTurn.intent === 'ask') request.citations = requestTurn.citations;
	if (requestTurn.intent === 'find_deal') request.productIds = requestTurn.productIds;
	return JSON.stringify({
		request,
		presentationHints: input.presentationHints,
		language: input.language,
		shopperHasBudget: input.hasBudget,
		plan: projectPlan(input.plan),
		inFocus: input.focus,
		cart: input.cart,
		recentlyViewed: input.viewed
	});
}

/**
 * Re-serialise a validated turn as an envelope for the browser: only validated values,
 * priorities back as levels, so the browser can re-validate it exactly like model output.
 */
export function toWireEnvelope(turn: Turn): Record<string, unknown> {
	const envelope: Record<string, unknown> = { intent: turn.intent, reply: turn.reply.text };
	if (turn.intent === 'restyle' || turn.intent === 'search' || turn.intent === 'persona') {
		const patch: Record<string, unknown> = { ...turn.patch };
		if (turn.patch.priorities)
			patch.priorities = Object.fromEntries(
				Object.entries(turn.patch.priorities).map(([key, weight]) => [
					key,
					nearestLevel(weight ?? 0)
				])
			);
		if (turn.patch.filters) {
			const filters: Record<string, unknown> = { ...turn.patch.filters };
			delete filters.maxPrice;
			patch.filters = filters;
		}
		envelope.patch = patch;
	}
	if (turn.intent === 'persona') envelope.persona = turn.persona;
	if (turn.intent === 'find_deal') envelope.productIds = turn.productIds;
	if (turn.intent === 'ask') envelope.citations = turn.citations;
	return envelope;
}
