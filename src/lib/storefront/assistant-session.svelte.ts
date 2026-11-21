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
	apply: (turn: Turn) => void,
	startPending: () => void
) {
	let poisonArmed = $state(false);
	let liveEnabled = $state(false);
	let livePending = $state(false);
	let liveFallback = $state(false);
	let liveModel = $state<string>();
	let liveRequest: AbortController | undefined;
	let pendingLocalTurn: Turn | undefined;
	let turn = $state<Turn>();

	function applyTurn(next: Turn) {
		turn = next;
		apply(next);
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
		if (fallback) applyTurn(fallback);
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
		if (
			simulating ||
			!dev ||
			!liveEnabled ||
			(local.intent !== 'chat' && local.intent !== 'change')
		) {
			applyTurn(local);
			return;
		}
		const hints = projectLiveHints(message);
		if (!hints.length) {
			applyTurn(local);
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
					applyTurn(local);
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
				const dropped = result.rejected
					? [...new Set([...proposed.dropped, 'unknown-field'])]
					: proposed.dropped;
				if (!Object.keys(additions).length) {
					applyTurn({ ...local, dropped });
					return;
				}
				liveModel = result.model;
				applyTurn({ ...proposed, patch: { ...local.patch, ...additions }, dropped });
			}
		);
	}

	return {
		cancel: cancelLive,
		toggle: toggleLive,
		armPoison() {
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
