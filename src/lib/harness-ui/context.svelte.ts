import { createContext } from 'svelte';
import {
	initialState,
	activeCategory,
	defaultCatalog,
	applyPatch,
	applyPersona,
	validatePatch,
	handleTurn,
	rankProducts,
	whatChanged,
	undo,
	reset,
	removeChip,
	withContext,
	recordSignal,
	acceptSuggestion,
	dismissSuggestion,
	priceBasket,
	standardPlan,
	PLAN_PARTS,
	projectTrace,
	type Transition,
	type HandledTurn,
	type RemoteAnswer,
	type Persona,
	type PlanPart,
	type SignalKind,
	type PlanPatch
} from '#lib/harness/index.ts';

export class HarnessContext {
	state = $state(initialState());
	last = $state<HandledTurn>();
	changes = $state<ReturnType<typeof whatChanged>>([]);
	pending = $state(false);
	forceOffline = $state(false);
	poison = $state(false);
	openedAt = Date.now();
	now = $state(Date.now());
	private request?: AbortController;
	private generation = 0;
	get lang() {
		return this.state.plan.language;
	}
	get ranked() {
		return rankProducts(defaultCatalog, this.state.plan);
	}
	get chips() {
		const p = this.state.plan;
		return PLAN_PARTS.filter(
			(part) =>
				this.state.explicit.includes(part) ||
				JSON.stringify(
					part.startsWith('filters.')
						? p.filters[part.slice(8) as keyof typeof p.filters]
						: p[part as keyof typeof p]
				) !==
					JSON.stringify(
						part.startsWith('filters.')
							? standardPlan.filters[part.slice(8) as keyof typeof p.filters]
							: standardPlan[part as keyof typeof p]
					)
		);
	}
	t = (en: string, th: string) => (this.lang === 'th' ? th : en);
	cancel() {
		this.generation++;
		this.request?.abort();
		this.request = undefined;
		this.pending = false;
	}
	transition(result: Transition) {
		this.cancel();
		this.state = result.state;
		this.changes = whatChanged(this.state.plan, result.changed, this.lang, defaultCatalog);
	}
	patch(raw: unknown) {
		this.transition(
			applyPatch(
				this.state,
				validatePatch(raw, this.state.plan, defaultCatalog, 'local').patch,
				'explicit',
				defaultCatalog
			)
		);
	}
	persona(value: Persona) {
		this.transition(applyPersona(this.state, value, {}, 'explicit', defaultCatalog));
	}
	undo() {
		this.transition(undo(this.state));
	}
	reset() {
		this.transition(reset(this.state));
	}
	remove(part: PlanPart) {
		this.transition(removeChip(this.state, part, defaultCatalog));
	}
	signal(kind: SignalKind) {
		this.state = recordSignal(this.state, { kind, at: Date.now() }, defaultCatalog);
	}
	accept(kind: SignalKind) {
		this.transition(acceptSuggestion(this.state, kind, defaultCatalog));
	}
	dismiss(kind: SignalKind) {
		this.state = dismissSuggestion(this.state, kind, defaultCatalog);
	}
	focus(id: string) {
		this.cancel();
		this.state = withContext(
			this.state,
			{ focus: [id], viewed: [...this.state.viewed, id] },
			defaultCatalog
		);
	}
	add(id: string) {
		this.cancel();
		this.state = withContext(this.state, { cart: [...this.state.cart, id] }, defaultCatalog);
	}
	deal(ids: readonly string[]) {
		return priceBasket(ids, { openedAt: this.openedAt, now: this.now });
	}
	preview(patch: PlanPatch) {
		const r = applyPatch(this.state, patch, 'explicit', defaultCatalog);
		return whatChanged(r.state.plan, r.changed, this.lang, defaultCatalog);
	}
	async send(message: string, fetcher: typeof fetch = fetch) {
		if (this.pending || !message.trim()) return;
		const text = message.normalize('NFC').trim().slice(0, 500);
		const generation = ++this.generation;
		const controller = new AbortController();
		this.request = controller;
		this.pending = true;
		const timeout = setTimeout(() => controller.abort(), 13000);
		let remote: RemoteAnswer | undefined;
		try {
			if (!this.forceOffline) {
				const response = await fetcher('/api/assistant', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					signal: controller.signal,
					body: JSON.stringify({
						message: text,
						plan: {
							...this.state.plan,
							query: '',
							filters: {
								...this.state.plan.filters,
								category: activeCategory(defaultCatalog, this.state.plan)
							}
						},
						focus: this.state.focus,
						cart: this.state.cart,
						viewed: this.state.viewed,
						poison: this.poison
					})
				});
				if (response.ok) {
					const data: unknown = await response.json();
					remote = data && typeof data === 'object' ? data : { fallbackReason: 'invalid_output' };
				} else remote = { fallbackReason: 'api_error' };
			}
		} catch {
			remote = { fallbackReason: controller.signal.aborted ? 'timeout' : 'api_error' };
		} finally {
			clearTimeout(timeout);
		}
		if (generation !== this.generation) return;
		this.now = Date.now();
		const result = handleTurn(
			this.state,
			{ message: text, remote, forceOffline: this.forceOffline },
			{ catalog: defaultCatalog, clock: { openedAt: this.openedAt, now: this.now } }
		);
		// The server has already stripped hostile fields. Preserve that projected audit
		// alongside the independent browser validation; neither changes the accepted plan.
		const serverTrace = remote?.trace ? projectTrace(remote.trace) : null;
		const trace = projectTrace({
			...result.trace,
			dropped: [...(serverTrace?.dropped ?? []), ...result.trace.dropped].filter(
				(d, i, a) => a.findIndex((x) => x.place === d.place && x.code === d.code) === i
			),
			guard:
				result.trace.guard === 'replaced' || serverTrace?.guard === 'replaced'
					? 'replaced'
					: 'passed'
		});
		this.state = result.state;
		this.last = { ...result, trace };
		this.changes = [...result.changes];
		this.pending = false;
		this.request = undefined;
		return this.last;
	}
}
export const [getHarness, setHarness] = createContext<HarnessContext>();
