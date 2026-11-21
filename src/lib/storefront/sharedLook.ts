import { defaultPlan, validateProposal, type ShopperPlan } from '../personalization';
import { encodeSharedLook, parseSharedLook } from './browserState';

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

export function receiptListingParams(plan: ShopperPlan): string {
	const params = new URLSearchParams({
		lang: plan.locale,
		theme: plan.theme === 'large-print' ? 'large' : plan.theme,
		view: 'receipt'
	});
	const token = encodeSharedLook(plan, lookFields);
	if (token) params.set('look', token);
	return params.toString();
}
