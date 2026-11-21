import { parseBudget } from '#lib/harness/budget.ts';
import type { CatalogPort } from '#lib/harness/catalog-port.ts';
import { hasThaiScript } from '#lib/harness/guard.ts';
import { initialState } from '#lib/harness/store.ts';
import { safeModelName, type ToolStep } from '#lib/harness/trace.ts';
import { interpretOffline } from '#lib/harness/offline.ts';
import { projectLiveHints } from '#lib/personalization/live.ts';
import { shownProducts, validateEnvelope } from '#lib/harness/turn.ts';
import type { Drop, FallbackReason, Intent, Plan } from '#lib/harness/types.ts';
import { POISONED_ENVELOPE } from './poison.ts';
import { systemPrompt, toWireEnvelope, userContext } from './projection.ts';
import {
	MAX_LISTINGS,
	MAX_SEARCH_RESULTS,
	parseReadArgs,
	parseSearchArgs,
	readListing,
	searchCatalog,
	toolSpecs,
	type Listing
} from './tools.ts';
import type { ModelMessage, ModelResponse, ModelTransport, ToolCall } from './transport.ts';

export type AgentLimits = Readonly<{
	/** Tool rounds allowed before the model must answer (so at most rounds + 1 calls). */
	toolRounds: number;
	perCallMs: number;
	overallMs: number;
	maxOutputTokens: number;
}>;

export const DEFAULT_LIMITS: AgentLimits = {
	toolRounds: 3,
	perCallMs: 6000,
	overallMs: 12000,
	maxOutputTokens: 800
};

export type AgentInput = Readonly<{
	message: string;
	plan: Plan;
	focus: readonly string[];
	cart: readonly string[];
	viewed: readonly string[];
	/** The shopper's budget from the client's plan; never sent to the model. */
	planBudget: number | null;
}>;

export type AgentDeps = Readonly<{
	catalog: CatalogPort;
	transport: ModelTransport | null;
	model: string | null;
	now: () => number;
	limits?: AgentLimits;
	forceOffline?: boolean;
	/** Development only: answer with the hostile envelope through the normal path. */
	poisoned?: boolean;
}>;

export type AgentTrace = Readonly<{
	intent: Intent;
	backend: 'model' | 'offline';
	model: string | null;
	fallbackReason: FallbackReason | null;
	rounds: number;
	tools: readonly ToolStep[];
	tokens: Readonly<{ input: number; output: number }>;
	ms: number;
	dropped: readonly Drop[];
	guard: 'passed' | 'replaced';
	changes: number;
	ranked: number;
}>;

export type AgentResult = Readonly<{
	/** A validated, re-serialised envelope, or null when the turn must use the keyword fallback. */
	envelope: Record<string, unknown> | null;
	/** Products read this turn; only these may be cited. */
	citable: readonly string[];
	fallbackReason: FallbackReason | null;
	trace: AgentTrace;
}>;

type Outcome =
	{ ok: true; response: ModelResponse } | { ok: false; reason: 'timeout' | 'api_error' };

/** Race one model call against its timer. The timer is armed first, so a tie is late. */
async function callWithTimeout(
	transport: ModelTransport,
	request: Parameters<ModelTransport['complete']>[0],
	ms: number
): Promise<Outcome> {
	const controller = new AbortController();
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<Outcome>((resolve) => {
		timer = setTimeout(() => {
			controller.abort();
			resolve({ ok: false, reason: 'timeout' });
		}, ms);
	});
	const call = transport
		.complete(request, controller.signal)
		.then((response): Outcome => ({ ok: true, response }))
		.catch((): Outcome => ({ ok: false, reason: 'api_error' }));
	try {
		return await Promise.race([timeout, call]);
	} finally {
		clearTimeout(timer);
	}
}

/**
 * The bounded agent: two read-only tools, a few rounds, a hard time limit, a small reading
 * budget, every step recorded. Any failure returns no envelope and a reason, and the store
 * answers with the keyword fallback instead.
 */
export async function runAgent(input: AgentInput, deps: AgentDeps): Promise<AgentResult> {
	const limits = deps.limits ?? DEFAULT_LIMITS;
	const { catalog } = deps;
	const started = deps.now();
	const model = safeModelName(deps.model);
	const tools: ToolStep[] = [];
	const tokens = { input: 0, output: 0 };
	let rounds = 0;
	const lang = hasThaiScript(input.message) ? 'th' : input.plan.language;
	const state = {
		...initialState(input.plan),
		focus: input.focus,
		cart: input.cart,
		viewed: input.viewed
	};

	const finish = (
		envelope: Record<string, unknown> | null,
		citable: readonly string[],
		fallbackReason: FallbackReason | null,
		extra: Partial<Pick<AgentTrace, 'intent' | 'dropped' | 'guard'>> = {}
	): AgentResult => ({
		envelope,
		citable,
		fallbackReason,
		trace: {
			intent: extra.intent ?? 'chat',
			backend: envelope ? 'model' : 'offline',
			model: envelope ? model : null,
			fallbackReason,
			rounds,
			tools,
			tokens,
			ms: Math.max(0, deps.now() - started),
			dropped: extra.dropped ?? [],
			guard: extra.guard ?? 'passed',
			changes: 0,
			ranked: 0
		}
	});

	const accept = (raw: unknown, citable: readonly string[]): AgentResult => {
		const validated = validateEnvelope(raw, state, catalog, { citable, lang });
		if (!validated) return finish(null, [], 'invalid_output');
		return finish(toWireEnvelope(validated.turn), citable, null, {
			intent: validated.turn.intent,
			dropped: validated.dropped,
			guard: validated.guard
		});
	};

	// Force offline always wins: removing the AI can only make the store more conservative.
	if (deps.forceOffline) return finish(null, [], 'forced_offline');
	if (deps.poisoned) return accept(POISONED_ENVELOPE, []);
	if (!deps.transport || !model) return finish(null, [], 'no_key');

	// Products in focus are read up front and count toward the reading budget.
	const read = new Set<string>();
	const focusListings: Listing[] = [];
	for (const id of input.focus.slice(0, MAX_LISTINGS)) {
		const listing = readListing(catalog, id, lang);
		if (listing) {
			read.add(id);
			focusListings.push(listing);
		}
	}
	const budget = parseBudget(input.message) ?? input.planBudget;

	const shown = shownProducts(state, catalog);
	const local = interpretOffline(input.message, state, catalog, shown);
	const requestTurn = validateEnvelope(local, state, catalog, {
		citable: shown.map((p) => p.id),
		lang
	})!.turn;
	const messages: ModelMessage[] = [
		{ role: 'system', content: systemPrompt(catalog) },
		{
			role: 'user',
			content: userContext({
				requestTurn,
				presentationHints: projectLiveHints(input.message),
				language: lang,
				plan: input.plan,
				focus: focusListings,
				cart: input.cart,
				viewed: input.viewed,
				hasBudget: budget !== null
			})
		}
	];
	const specs = toolSpecs(catalog);

	for (;;) {
		const elapsed = deps.now() - started;
		if (elapsed >= limits.overallMs) return finish(null, [], 'deadline');
		const window = Math.min(limits.perCallMs, limits.overallMs - elapsed);
		rounds += 1;
		const outcome = await callWithTimeout(
			deps.transport,
			{ model, messages: [...messages], tools: specs, maxOutputTokens: limits.maxOutputTokens },
			window
		);
		if (deps.now() - started >= limits.overallMs) return finish(null, [], 'deadline');
		if (!outcome.ok)
			return finish(
				null,
				[],
				outcome.reason === 'timeout' && window < limits.perCallMs ? 'deadline' : outcome.reason
			);
		const response = outcome.response;
		tokens.input += Math.max(0, response.usage.input || 0);
		tokens.output += Math.max(0, response.usage.output || 0);

		if (response.kind === 'refusal') return finish(null, [], 'refusal');
		if (response.kind === 'length') return finish(null, [], 'output_cut');
		if (response.kind === 'final') {
			let parsed: unknown;
			try {
				parsed = JSON.parse(response.text);
			} catch {
				return finish(null, [], 'invalid_output');
			}
			return accept(parsed, [...read]);
		}

		// Tool round. The answer must come by the call after the last allowed round.
		if (rounds > limits.toolRounds) return finish(null, [], 'too_many_rounds');
		const echoed: ToolCall[] = [];
		const results: ModelMessage[] = [];
		for (const [index, raw] of response.calls.slice(0, 3).entries()) {
			// Our own call ids, so nothing model-written is echoed back.
			const call = { ...raw, id: `call_r${rounds}_${index}` };
			const toolStarted = deps.now();
			if (call.name === 'search_catalog') {
				const args = parseSearchArgs(call.arguments, catalog);
				const hits = searchCatalog(catalog, args, budget);
				echoed.push({ id: call.id, name: call.name, arguments: JSON.stringify(args) });
				results.push({
					role: 'tool',
					toolCallId: call.id,
					content: JSON.stringify({ results: hits })
				});
				tools.push({
					kind: 'search_catalog',
					results: Math.min(hits.length, MAX_SEARCH_RESULTS),
					ms: deps.now() - toolStarted
				});
			} else if (call.name === 'read_listing') {
				const wanted = parseReadArgs(call.arguments, catalog);
				const listings: Listing[] = [];
				for (const id of wanted) {
					if (read.has(id)) continue;
					if (read.size >= MAX_LISTINGS) break;
					const listing = readListing(catalog, id, lang);
					if (listing) {
						read.add(id);
						listings.push(listing);
					}
				}
				echoed.push({
					id: call.id,
					name: call.name,
					arguments: JSON.stringify({ productIds: wanted })
				});
				results.push({
					role: 'tool',
					toolCallId: call.id,
					content: JSON.stringify({ listings, readingBudgetLeft: MAX_LISTINGS - read.size > 0 })
				});
				tools.push({
					kind: 'read_listing',
					results: listings.length,
					ms: deps.now() - toolStarted
				});
			} else {
				echoed.push({ id: call.id, name: 'unknown_tool', arguments: '{}' });
				results.push({
					role: 'tool',
					toolCallId: call.id,
					content: JSON.stringify({ error: 'unknown tool' })
				});
				tools.push({ kind: 'unknown_tool', results: 0, ms: deps.now() - toolStarted });
			}
		}
		// Echo only our own re-serialised arguments, never the model's raw text.
		messages.push({ role: 'assistant', content: null, toolCalls: echoed }, ...results);
	}
}
