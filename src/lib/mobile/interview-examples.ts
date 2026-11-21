import { interviewProposal, type Answers } from '../personalization/interview';
import { defaultPlan, type ShopperPlan } from '../personalization/plan';

export const examples: { id: string; answers: Answers }[] = [
	{
		id: 'A',
		answers: { goal: 'browse', evidence: 'photos', priority: 'value', reading: 'spacious' }
	},
	{
		id: 'B',
		answers: { goal: 'compare', evidence: 'specs', priority: 'performance', reading: 'compact' }
	},
	{
		id: 'C',
		answers: { goal: 'shortlist', evidence: 'summary', priority: 'durability', reading: 'large' }
	}
];

// Each preview starts from the same neutral baseline; the live store is not mutated.
export function previewInterview(answers: Answers, locale: ShopperPlan['locale']) {
	const base = { ...structuredClone(defaultPlan), locale, priorities: {} };
	const result = interviewProposal(answers, base);
	return { ...result, plan: { ...base, ...result.patch } };
}
