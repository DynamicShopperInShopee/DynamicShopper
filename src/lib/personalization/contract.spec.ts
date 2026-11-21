import { describe, expect, it } from 'vitest';

import { applyTurn, interpretOffline, rankProducts } from './index';
import { contractSample } from '#lib/fixtures/contract-sample';

describe('personalization contract', () => {
	it('ranks the shared products without replacing their catalog records', () => {
		const ranked = rankProducts(contractSample.products, contractSample.openingState.plan);

		expect(ranked.map(({ product }) => product.id)).toEqual(['cooker-one-button']);
		expect(ranked[0]?.product).toBe(contractSample.products[0]);
		expect(ranked[0]?.terms).toEqual(contractSample.expectedRankingTerms);
	});

	it('applies valid fields independently and does not record a no-op', () => {
		const changed = applyTurn(contractSample.openingState, contractSample.mixedTurn);
		const afterNoOp = applyTurn(changed, contractSample.noOpTurn);

		expect(changed.plan.theme).toBe('minimal');
		expect(changed.plan.sections).toEqual(contractSample.openingState.plan.sections);
		expect(changed.lastTurn?.turn.trace.dropped).toContain('invalid-section');
		expect(afterNoOp.undo).toEqual(changed.undo);
	});

	it('lets direct language override an inferred persona default', () => {
		const turn = interpretOffline(
			contractSample.directLanguageMessage,
			contractSample.openingState
		);

		expect(turn.intent).toBe('change');
		const next = applyTurn(contractSample.openingState, turn);
		expect(next.plan.language).toBe('en');
		expect(next.explicit.fields).toContain('language');
	});

	it('undoes the effective change even when a no-op followed it', () => {
		const changed = applyTurn(contractSample.openingState, contractSample.mixedTurn);
		const afterNoOp = applyTurn(changed, contractSample.noOpTurn);
		const undo = interpretOffline(contractSample.undoMessage, afterNoOp);
		const restored = applyTurn(afterNoOp, undo);

		expect(undo).toMatchObject({ intent: 'undo' });
		expect(restored.plan).toEqual(contractSample.openingState.plan);
		expect(restored.explicit).toEqual(contractSample.openingState.explicit);
	});

	it('answers a listing question only with a verified shared-product reference', () => {
		const turn = interpretOffline(contractSample.questionMessage, contractSample.openingState);

		expect(turn.intent).toBe('ask');
		if (turn.intent !== 'ask') throw new Error('expected an ask turn');
		expect(turn.citations).toEqual([{ productId: 'cooker-one-button', field: 'spec.capacity' }]);
		expect(turn.reply).not.toMatch(/[\p{N}\p{Sc}<>]|baht|บาท|thb|usd/iu);
	});
});
