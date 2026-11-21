import { describe, expect, it } from 'vitest';
import { getProduct, resolveFact } from '../catalog';
import { contractSample } from '../fixtures/contract-sample';
import { defaultPlan, interpretOffline, rankProducts, validateProposal } from './index';

describe('personalization contract', () => {
	const anchor = getProduct(contractSample.anchorProduct.id)!;
	const plan = { ...defaultPlan, category: anchor.category, priorities: { value: 1 } };

	it('ranks the shared product with its catalog record and value score', () => {
		const [ranked] = rankProducts([anchor], plan);
		expect(ranked.product).toBe(anchor);
		expect(ranked.terms).toEqual([{ key: 'value', contribution: anchor.scores.value }]);
	});

	it('applies a valid theme independently of an unknown section', () => {
		const turn = validateProposal(contractSample.mixedProposal, plan);
		expect(turn.patch).toEqual({ theme: 'minimal' });
		expect(turn.dropped).toContain('sections');
		expect({ ...plan, ...turn.patch }.sections).toEqual(plan.sections);
	});

	it('answers the Thai capacity question from the focused listing', () => {
		const turn = interpretOffline(contractSample.questionMessage, plan, anchor.id);
		expect(turn.intent).toBe('ask');
		expect(turn.citations).toEqual(contractSample.questionTurn.citations);
		expect(resolveFact(anchor.id, turn.citations[0].field)).toBeDefined();
		expect(turn.reply).not.toMatch(/[\p{N}\p{Sc}<>]|baht|บาท|thb|usd/iu);
		expect(interpretOffline(contractSample.questionMessage, plan).citations).toEqual([]);
	});
});
