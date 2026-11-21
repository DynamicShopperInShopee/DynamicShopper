import { dev } from '$app/env';
import { resolve } from '$app/paths';
import {
	interpretOffline,
	validateProposal,
	type ShopperPlan,
	type Turn
} from '../personalization';
import { projectLiveHints } from '../personalization/live';
import { fillPresentationGaps, requestLivePreview } from './live-preview';

type AssistantContext = {
	plan: ShopperPlan;
	locks: readonly (keyof ShopperPlan)[];
	focus?: string;
};

export function createAssistantSession(
	read: () => AssistantContext,
	apply: (turn: Turn, requestedCategory?: ShopperPlan['category']) => void,
	startPending: () => void
) {
	let poisonArmed = $state(false);
	let liveEnabled = $state(false);
	let livePending = $state(false);
	let liveFallback = $state(false);
	let liveModel = $state<{ name: string; addedChanges: boolean }>();
	let liveRequest: AbortController | undefined;
	let pendingLocalTurn: Turn | undefined;
	let turn = $state<Turn>();

	function applyTurn(next: Turn, requestedCategory?: ShopperPlan['category']) {
		turn = next;
		apply(next, requestedCategory);
	}
	function cancelLive() {
		liveRequest?.abort();
		liveRequest = undefined;
		pendingLocalTurn = undefined;
		livePending = false;
	}
	function toggleLive() {
		if (!dev) return;
		const fallback = pendingLocalTurn;
		cancelLive();
		liveEnabled = !liveEnabled;
		if (fallback) applyTurn(fallback, fallback.patch.category);
	}

	function send(message: string) {
		cancelLive();
		liveModel = undefined;
		liveFallback = false;
		const { plan, focus } = read();
		const simulating = dev && poisonArmed;
		poisonArmed = false;
		const local = simulating
			? validateProposal(
					{
						intent: 'change',
						patch: { price: 1, layout: 'foreign', sections: ['unknown'] },
						reply: '฿1'
					},
					plan,
					focus
				)
			: interpretOffline(message, plan, focus);
		// Only the offline parser reads product categories from the shopper's message.
		const requestedCategory = simulating ? undefined : local.patch.category;
		if (
			simulating ||
			!dev ||
			!liveEnabled ||
			(local.intent !== 'chat' && local.intent !== 'change')
		) {
			applyTurn(local, requestedCategory);
			return;
		}
		const hints = projectLiveHints(message);
		if (!hints.length) {
			applyTurn(local, requestedCategory);
			return;
		}
		const request = new AbortController();
		liveRequest = request;
		pendingLocalTurn = local;
		livePending = true;
		turn = undefined;
		startPending();
		void requestLivePreview(resolve('/api/local-assistant'), hints, request.signal).then(
			(result) => {
				if (liveRequest !== request) return;
				liveRequest = undefined;
				pendingLocalTurn = undefined;
				livePending = false;
				if (!result) {
					liveFallback = true;
					applyTurn(local, requestedCategory);
					return;
				}
				const current = read();
				const proposed = validateProposal(
					{ intent: 'change', patch: result.patch },
					current.plan,
					focus
				);
				const additions = fillPresentationGaps(
					local.patch,
					proposed.patch,
					current.plan,
					current.locks
				);
				const dropped =
					result.rejected && !proposed.dropped.includes('unknown-field')
						? [...proposed.dropped, 'unknown-field']
						: proposed.dropped;
				const addedChanges = Object.keys(additions).length > 0;
				if (Object.keys(result.patch).length) liveModel = { name: result.model, addedChanges };
				if (!addedChanges) {
					applyTurn({ ...local, dropped }, requestedCategory);
					return;
				}
				applyTurn(
					{ ...proposed, patch: { ...local.patch, ...additions }, dropped },
					requestedCategory
				);
			}
		);
	}

	return {
		cancel: cancelLive,
		clearReply: () => {
			turn = undefined;
			liveModel = undefined;
			liveFallback = false;
		},
		toggle: toggleLive,
		armPoison: () => {
			if (dev) poisonArmed = true;
		},
		send,
		get turn() {
			return turn;
		},
		get enabled() {
			return liveEnabled;
		},
		get pending() {
			return livePending;
		},
		get fallback() {
			return liveFallback;
		},
		get model() {
			return liveModel;
		},
		get poisonArmed() {
			return poisonArmed;
		}
	};
}
