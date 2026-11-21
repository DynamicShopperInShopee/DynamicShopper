import { parseLiveHints, readLiveProposal, type LiveHint } from '../personalization/live';
import type { ShopperPlan } from '../personalization';

export function fillPresentationGaps(
	local: Partial<ShopperPlan>,
	model: Partial<ShopperPlan>,
	current: ShopperPlan,
	locks: readonly (keyof ShopperPlan)[]
) {
	return Object.fromEntries(
		Object.entries(readLiveProposal(model).patch).filter(([field, value]) => {
			const key = field as keyof ShopperPlan;
			return !Object.hasOwn(local, key) && !locks.includes(key) && current[key] !== value;
		})
	) as Partial<ShopperPlan>;
}

export async function requestLivePreview(
	url: string,
	hints: readonly LiveHint[],
	signal: AbortSignal,
	transport: typeof fetch = fetch
): Promise<{ patch: Partial<ShopperPlan>; model: string; rejected: boolean } | null> {
	const safeHints = parseLiveHints(hints);
	if (!safeHints?.length || signal.aborted) return null;
	try {
		const response = await transport(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ hints: safeHints }),
			signal: AbortSignal.any([signal, AbortSignal.timeout(9000)])
		});
		if (!response.ok) return null;
		const value: unknown = await response.json();
		if (
			!value ||
			typeof value !== 'object' ||
			!('model' in value) ||
			typeof value.model !== 'string' ||
			!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/u.test(value.model) ||
			!('patch' in value)
		)
			return null;
		const { patch, rejected } = readLiveProposal(value.patch);
		const hasRejection = rejected || ('rejected' in value && value.rejected === true);
		return Object.keys(patch).length || hasRejection
			? { patch, model: value.model, rejected: hasRejection }
			: null;
	} catch {
		return null;
	}
}
