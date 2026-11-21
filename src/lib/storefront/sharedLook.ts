import { defaultPlan, validateProposal } from '../personalization';
import { parseSharedLook } from './browserState';

export const lookFields = [
	'theme',
	'layout',
	'density',
	'locale',
	'details',
	'sections',
	'simplified'
] as const;

export function validateLook(input: unknown) {
	const proposal = validateProposal({ intent: 'change', patch: input }, defaultPlan);
	return proposal.dropped.length || !Object.keys(proposal.patch).length
		? undefined
		: proposal.patch;
}

export function isValidLook(token: string): boolean {
	return (
		/^(standard|minimal|vibrant|large)\.(grid|list|table)\.(en|th)$/.test(token) ||
		Boolean(parseSharedLook(token, lookFields, validateLook))
	);
}
