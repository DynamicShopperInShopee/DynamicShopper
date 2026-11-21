import { describe, expect, it } from 'vitest';

import { contractSample } from '#lib/fixtures/contract-sample.ts';
import {
	defaultCatalog,
	explainRank,
	handleTurn,
	initialState,
	rankProducts,
	standardPlan,
	type CatalogPort,
	type Plan,
	type StoreState
} from '#lib/harness/index.ts';

const sample = contractSample.openingState;
const catalog: CatalogPort = { ...defaultCatalog, products: contractSample.products };
const plan: Plan = {
	...standardPlan,
	language: sample.plan.language,
	cardFields: sample.plan.cardFields,
	highlightSpecs: sample.plan.highlightedSpecs,
	query: sample.plan.searchWords.join(' '),
	filters: {
		category: sample.plan.category,
		maxPrice: sample.plan.maxPrice,
		shops: sample.plan.shopIds,
		mallOnly: sample.plan.mallOnly
	},
	priorities: { ...standardPlan.priorities, ...sample.plan.priorities }
};
const openingState: StoreState = {
	...initialState(plan),
	explicit: ['language'],
	focus: [sample.focusProductId],
	cart: sample.cart.map(({ productId }) => productId)
};
const deps = { catalog, clock: contractSample.pricingContext };
const mixedInput = {
	message: contractSample.styleRequest,
	remote: {
		envelope: {
			...contractSample.mixedProposal,
			intent: 'restyle'
		}
	}
};
const noOpInput = {
	message: 'minimal',
	remote: { envelope: { intent: 'restyle', patch: contractSample.noOpTurn.patch } }
};

describe('personalization contract through the storefront harness', () => {
	it('ranks the shared products without replacing their catalog records', () => {
		const ranked = rankProducts(catalog, openingState.plan);

		expect(ranked.map(({ product }) => product.id)).toEqual(['cooker-one-button']);
		expect(ranked[0]?.product).toBe(contractSample.products[0]);
		// Positive explanations come from the same numeric terms used for the score.
		expect(ranked[0]?.terms.filter(({ contribution }) => contribution > 0)).toEqual([
			{
				id: 'value',
				label: { en: 'Value', th: 'ความคุ้มค่า' },
				contribution: contractSample.anchorProduct.scores.value * sample.plan.priorities.value
			}
		]);
		expect(explainRank(ranked[0])).toEqual([{ label: { en: 'Value', th: 'ความคุ้มค่า' }, width: 4 }]);
	});

	it('applies valid fields independently and does not record a no-op', () => {
		const changed = handleTurn(openingState, mixedInput, deps);
		const afterNoOp = handleTurn(changed.state, noOpInput, deps);

		expect(changed.backend).toBe('model');
		expect(changed.state.plan.theme).toBe('minimal');
		expect(changed.state.plan.sections).toEqual(openingState.plan.sections);
		expect(changed.trace.dropped).toContainEqual({ place: 'sections', code: 'unknown_value' });
		expect(changed.state.undo).toHaveLength(1);
		expect(afterNoOp.changes).toEqual([]);
		expect(afterNoOp.state.undo).toBe(changed.state.undo);
	});

	it('lets direct language override an inferred persona default', () => {
		const next = handleTurn(openingState, { message: contractSample.directLanguageMessage }, deps);

		expect(next.turn.intent).toBe('persona');
		expect(next.state.plan).toMatchObject({ language: 'en', theme: 'large-print', layout: 'list' });
		expect(next.state.explicit).toContain('language');
		expect(next.trace.dropped).toContainEqual({ place: 'language', code: 'explicit_wins' });
	});

	it('undoes the effective change even when a no-op followed it', () => {
		const changed = handleTurn(openingState, mixedInput, deps);
		const afterNoOp = handleTurn(changed.state, noOpInput, deps);
		const restored = handleTurn(afterNoOp.state, { message: contractSample.undoMessage }, deps);

		expect(restored.turn.intent).toBe('undo');
		expect(restored.state.plan).toEqual(openingState.plan);
		expect(restored.state.explicit).toEqual(openingState.explicit);
		expect(restored.state.undo).toEqual([]);
	});

	it('answers a listing question only with a verified shared-product reference', () => {
		const result = handleTurn(openingState, { message: contractSample.questionMessage }, deps);

		expect(result.turn.intent).toBe('ask');
		if (result.turn.intent !== 'ask') throw new Error('expected an ask turn');
		expect(result.turn.citations).toEqual([
			{ productId: 'cooker-one-button', kind: 'spec', key: 'capacity' }
		]);
		expect(result.turn.reply.text).not.toMatch(/[\p{N}\p{Sc}<>]|baht|บาท|thb|usd/iu);
		expect(result.state.plan).toBe(openingState.plan);
		expect(result.state.undo).toBe(openingState.undo);
	});
});
