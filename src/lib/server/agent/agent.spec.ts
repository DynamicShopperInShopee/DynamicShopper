import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '#lib/catalog/index.ts';
import { defaultCatalog, type CatalogPort } from '#lib/harness/catalog-port.ts';
import { FORBIDDEN_REPLY } from '#lib/harness/guard.ts';
import { mergePlan, standardPlan } from '#lib/harness/plan.ts';
import { initialState } from '#lib/harness/store.ts';
import { handleTurn } from '#lib/harness/turn.ts';
import type { Plan } from '#lib/harness/types.ts';
import { DEFAULT_LIMITS, runAgent, type AgentInput } from './agent.ts';
import {
	toOpenAIParams,
	type ModelRequest,
	type ModelResponse,
	type ModelTransport
} from './transport.ts';

const usage = { input: 100, output: 20 };
const final = (envelope: unknown): ModelResponse => ({
	kind: 'final',
	text: JSON.stringify(envelope),
	usage
});
const tool = (name: string, args: unknown): ModelResponse => ({
	kind: 'tool_calls',
	calls: [{ id: 'model-chosen-id-99999', name, arguments: JSON.stringify(args) }],
	usage
});

type Step = ModelResponse | { delay: number; response?: ModelResponse } | 'hang' | 'reject';

/** A scripted transport that records every request it receives. */
function scripted(steps: Step[]) {
	const requests: ModelRequest[] = [];
	const transport: ModelTransport = {
		complete(request) {
			requests.push(structuredClone<ModelRequest>(request));
			const step = steps[requests.length - 1] ?? 'hang';
			if (step === 'hang') return new Promise(() => {});
			if (step === 'reject') return Promise.reject(new Error('boom'));
			if ('delay' in step)
				return new Promise((resolve) =>
					setTimeout(
						() => resolve(step.response ?? final({ intent: 'chat', reply: 'Hi.' })),
						step.delay
					)
				);
			return Promise.resolve(step);
		}
	};
	return { transport, requests };
}

/** The last tool result the model was sent in a request. */
const toolResult = <T>(request: ModelRequest): T => {
	const last = request.messages.at(-1);
	return JSON.parse(last && last.role === 'tool' ? last.content : '{}') as T;
};

const input = (overrides: Partial<AgentInput> = {}): AgentInput => ({
	message: 'something nice for gaming',
	plan: standardPlan,
	focus: [],
	cart: [],
	viewed: [],
	planBudget: null,
	...overrides
});

const deps = (transport: ModelTransport | null, catalog: CatalogPort = defaultCatalog) => ({
	catalog,
	transport,
	model: 'test-model',
	now: () => Date.now()
});

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
	vi.setSystemTime(1_800_000_000_000);
});
afterEach(() => vi.useRealTimers());

describe('R8 · the model never sees a price', () => {
	it('no sentinel amount appears in any serialized request on any round', async () => {
		const SENTINELS = [
			'987654',
			'876543',
			'76543',
			'654321',
			'543210',
			'4.123',
			'43210',
			'31337',
			'24680',
			'11223'
		];
		const catalog: CatalogPort = {
			...defaultCatalog,
			products: defaultCatalog.products.map((product): Product => ({
				...product,
				price: 987654,
				originalPrice: 876543,
				shipping: 76543,
				sold: 654321,
				reviewCount: 543210,
				rating: 4.123,
				summary: {
					en: `${product.summary.en} Only ฿43210 today.`,
					th: `${product.summary.th} เหลือ 43210 บาท`
				},
				reviews: [{ en: 'Worth 43210 baht', th: 'คุ้ม 43210 บาท' }, product.reviews[1]]
			}))
		};
		const plan: Plan = mergePlan(
			standardPlan,
			{ filters: { category: 'mouse', maxPrice: 31337 } },
			catalog
		);
		const toolArgs = { words: 'mouse 11223 baht', category: 'mouse', withinBudget: true };
		const sources = JSON.stringify({
			catalog,
			plan,
			message: 'under 24680 baht',
			toolArgs
		});
		for (const sentinel of SENTINELS)
			expect(sources, `sentinel ${sentinel} planted`).toContain(sentinel);

		const { transport, requests } = scripted([
			tool('search_catalog', toolArgs),
			tool('read_listing', { productIds: ['aero-x', 'nova-lite'] }),
			final({
				intent: 'ask',
				citations: [{ productId: 'aero-x', kind: 'spec', key: 'battery' }],
				reply: 'It lasts long.'
			})
		]);
		const result = await runAgent(
			input({
				message: 'which mouse lasts longest under 24680 baht?',
				plan,
				focus: ['vortex-w'],
				planBudget: 31337
			}),
			deps(transport, catalog)
		);
		expect(result.envelope).not.toBeNull();
		expect(requests).toHaveLength(3);
		for (const request of requests) {
			for (const serialized of [JSON.stringify(request), JSON.stringify(toOpenAIParams(request))])
				for (const sentinel of SENTINELS)
					expect(serialized, `sentinel ${sentinel}`).not.toContain(sentinel);
			expect(JSON.stringify(request)).not.toContain('model-chosen-id');
		}
	});

	it('real catalog prices do not appear in the instructions or tool results', async () => {
		const { transport, requests } = scripted([
			tool('search_catalog', { words: '', category: null, withinBudget: false }),
			tool('read_listing', { productIds: ['cooker-ih', 'studio-x', 'titan-max'] }),
			final({ intent: 'chat', reply: 'Here to help.' })
		]);
		await runAgent(input(), deps(transport));
		// Numbers that are legitimately in names, specs or prose (e.g. "120h battery") are not prices.
		const nonPriceText = JSON.stringify(
			defaultCatalog.products.map((p) => [p.name, p.specs, p.summary, p.reviews, p.tags])
		);
		const prices = new Set(
			defaultCatalog.products
				.flatMap((p) => [p.price, p.originalPrice, p.shipping, p.sold, p.reviewCount])
				.filter(
					(n): n is number =>
						!!n && n > 100 && !new RegExp(`(?<![\\d.])${n}(?![\\d.])`).test(nonPriceText)
				)
		);
		expect(prices.size).toBeGreaterThan(30);
		const toolText = requests
			.flatMap((r) => r.messages.filter((m) => m.role === 'tool').map((m) => m.content))
			.join(' ');
		for (const price of prices)
			expect(toolText).not.toMatch(new RegExp(`(?<![\\d.])${price}(?![\\d.])`));
		expect(JSON.stringify(requests)).not.toMatch(
			/"(price|originalPrice|shipping|sold|reviewCount|rating)"/
		);
	});
});

describe('R9 · the agent is bounded', () => {
	it('a call that never answers is cut at exactly the per-call limit', async () => {
		const { transport } = scripted(['hang']);
		const pending = runAgent(input(), deps(transport));
		await vi.advanceTimersByTimeAsync(DEFAULT_LIMITS.perCallMs - 1);
		let settled = false;
		void pending.then(() => (settled = true));
		await vi.advanceTimersByTimeAsync(0);
		expect(settled).toBe(false);
		await vi.advanceTimersByTimeAsync(1);
		const result = await pending;
		expect(result.fallbackReason).toBe('timeout');
		expect(result.trace.ms).toBe(DEFAULT_LIMITS.perCallMs);
	});

	it('an answer one millisecond before the per-call limit is on time; at the limit it is late', async () => {
		const onTime = scripted([
			{ delay: DEFAULT_LIMITS.perCallMs - 1, response: final({ intent: 'chat', reply: 'Hello.' }) }
		]);
		const a = runAgent(input(), deps(onTime.transport));
		await vi.advanceTimersByTimeAsync(DEFAULT_LIMITS.perCallMs);
		expect((await a).fallbackReason).toBeNull();
		const late = scripted([
			{ delay: DEFAULT_LIMITS.perCallMs, response: final({ intent: 'chat', reply: 'Hello.' }) }
		]);
		const b = runAgent(input(), deps(late.transport));
		await vi.advanceTimersByTimeAsync(DEFAULT_LIMITS.perCallMs);
		expect((await b).fallbackReason).toBe('timeout');
	});

	it('the whole loop stops at the overall deadline (boundary at 11999 / 12000 ms)', async () => {
		const search = tool('search_catalog', {
			words: 'mouse',
			category: 'mouse',
			withinBudget: false
		});
		const run = async (lastDelay: number) => {
			const { transport } = scripted([
				{ delay: 5000, response: search },
				{ delay: 5000, response: search },
				{ delay: lastDelay, response: final({ intent: 'chat', reply: 'Done.' }) }
			]);
			const pending = runAgent(input(), deps(transport));
			await vi.advanceTimersByTimeAsync(20_000);
			return pending;
		};
		expect((await run(1999)).fallbackReason).toBeNull();
		const late = await run(2000);
		expect(late.fallbackReason).toBe('deadline');
		expect(late.trace.ms).toBe(DEFAULT_LIMITS.overallMs);
		const hung = scripted([
			{ delay: 5000, response: search },
			{ delay: 5000, response: search },
			'hang'
		]);
		const pending = runAgent(input(), deps(hung.transport));
		await vi.advanceTimersByTimeAsync(20_000);
		expect((await pending).fallbackReason).toBe('deadline');
	});

	it('allows three tool rounds and one answer; a fourth tool request falls back', async () => {
		const search = tool('search_catalog', { words: 'mouse', category: null, withinBudget: false });
		const ok = scripted([search, search, search, final({ intent: 'chat', reply: 'Done.' })]);
		const answered = await runAgent(input(), deps(ok.transport));
		expect(answered.fallbackReason).toBeNull();
		expect(ok.requests).toHaveLength(4);
		expect(answered.trace.rounds).toBe(4);
		const greedy = scripted([
			search,
			search,
			search,
			search,
			final({ intent: 'chat', reply: 'Done.' })
		]);
		const refused = await runAgent(input(), deps(greedy.transport));
		expect(refused.fallbackReason).toBe('too_many_rounds');
		expect(greedy.requests).toHaveLength(4);
	});

	it('returns at most ten search results and reads at most three listings including focus', async () => {
		const { transport, requests } = scripted([
			tool('search_catalog', { words: '', category: null, withinBudget: false }),
			tool('read_listing', { productIds: ['aero-x', 'nova-lite', 'titan-max', 'rogue-o'] }),
			final({
				intent: 'ask',
				citations: [
					{ productId: 'rogue-o', kind: 'summary', key: 'summary' },
					{ productId: 'aero-x', kind: 'summary', key: 'summary' }
				],
				reply: 'Here.'
			})
		]);
		const result = await runAgent(input({ focus: ['vortex-w', 'ergo-g'] }), deps(transport));
		const searchResult = toolResult<{ results: unknown[] }>(requests[1]);
		expect(searchResult.results).toHaveLength(10);
		const { listings } = toolResult<{ listings: { id: string }[] }>(requests[2]);
		expect(listings.map((l) => l.id)).toEqual(['aero-x']);
		expect([...result.citable].sort()).toEqual(['aero-x', 'ergo-g', 'vortex-w']);
		expect(result.envelope?.citations).toEqual([
			{ productId: 'aero-x', kind: 'summary', key: 'summary' }
		]);
		expect(result.trace.tools).toEqual([
			{ kind: 'search_catalog', results: 10, ms: 0 },
			{ kind: 'read_listing', results: 1, ms: 0 }
		]);
	});

	it('applies the budget on the store side when asked, and tools cannot change the catalog', async () => {
		const deepFreeze = <T>(value: T): T => {
			if (value && typeof value === 'object') {
				Object.values(value).forEach(deepFreeze);
				Object.freeze(value);
			}
			return value;
		};
		const catalog = deepFreeze(structuredClone(defaultCatalog));
		const before = JSON.stringify(catalog);
		const { transport, requests } = scripted([
			tool('search_catalog', { words: 'mouse', category: 'mouse', withinBudget: true }),
			tool('read_listing', { productIds: ['aero-x'] }),
			final({ intent: 'chat', reply: 'Here.' })
		]);
		await runAgent(input({ message: 'mouse under 1500 baht' }), deps(transport, catalog));
		const ids = toolResult<{ results: { id: string }[] }>(requests[1])
			.results.map((r) => r.id)
			.sort();
		expect(ids).toEqual(['aero-x', 'nova-lite', 'vortex-w']);
		expect(JSON.stringify(catalog)).toBe(before);
	});
});

describe('R10 · every failure falls back with a named reason', () => {
	it.each<[string, Step[], string]>([
		['provider error', ['reject'], 'api_error'],
		['refusal', [{ kind: 'refusal', usage }], 'refusal'],
		['output cut off', [{ kind: 'length', usage }], 'output_cut'],
		['not JSON', [{ kind: 'final', text: 'Sure! Here is a calm store.', usage }], 'invalid_output'],
		['unknown intent', [final({ intent: 'take_over', reply: 'hi' })], 'invalid_output'],
		['not an object', [final(['restyle'])], 'invalid_output']
	])('%s → %s', async (_name, steps, reason) => {
		const { transport } = scripted(steps);
		const result = await runAgent(input(), deps(transport));
		expect(result.envelope).toBeNull();
		expect(result.fallbackReason).toBe(reason);
		expect(result.trace.backend).toBe('offline');
	});

	it('no key, no model id and force offline never call a provider', async () => {
		const { transport, requests } = scripted([]);
		expect((await runAgent(input(), { ...deps(null) })).fallbackReason).toBe('no_key');
		expect((await runAgent(input(), { ...deps(transport), model: null })).fallbackReason).toBe(
			'no_key'
		);
		expect(
			(await runAgent(input(), { ...deps(transport), forceOffline: true })).fallbackReason
		).toBe('forced_offline');
		expect(requests).toHaveLength(0);
	});

	it('force offline wins over the poisoned model', async () => {
		const result = await runAgent(input(), { ...deps(null), poisoned: true, forceOffline: true });
		expect(result.envelope).toBeNull();
		expect(result.fallbackReason).toBe('forced_offline');
	});

	it('records calls to unknown tools as visible steps', async () => {
		const { transport } = scripted([
			tool('delete_everything', {}),
			final({ intent: 'chat', reply: 'Hi.' })
		]);
		const result = await runAgent(input(), deps(transport));
		expect(result.trace.tools).toEqual([{ kind: 'unknown_tool', results: 0, ms: 0 }]);
	});

	it('a partly valid envelope survives with its drops listed', async () => {
		const { transport } = scripted([
			final({
				intent: 'restyle',
				patch: { theme: 'minimal', layout: 'hologram' },
				reply: 'Calmer.'
			})
		]);
		const result = await runAgent(input(), deps(transport));
		expect(result.envelope).toEqual({
			intent: 'restyle',
			patch: { theme: 'minimal' },
			reply: 'Calmer.'
		});
		expect(result.trace.dropped).toEqual([{ place: 'layout', code: 'unknown_value' }]);
	});

	it('the browser turns a fallback into a keyword-parser answer with the same reason', async () => {
		const { transport } = scripted(['reject']);
		const remote = await runAgent(input({ message: 'make it colourful' }), deps(transport));
		const turn = handleTurn(
			initialState(),
			{ message: 'make it colourful', remote },
			{ catalog: defaultCatalog, clock: { openedAt: 0, now: 0 } }
		);
		expect(turn.backend).toBe('offline');
		expect(turn.trace.fallbackReason).toBe('api_error');
		expect(turn.state.plan.theme).toBe('vibrant');
	});
});

describe('R13 · the poisoned model changes nothing factual', () => {
	it('every defence fires and the plan, catalog and prices stay put', async () => {
		const catalogBefore = JSON.stringify(defaultCatalog);
		const state = initialState();
		const remote = await runAgent(input({ message: 'anything' }), {
			...deps(null),
			poisoned: true
		});
		expect(remote.envelope).not.toBeNull();
		expect(remote.trace.guard).toBe('replaced');
		const turn = handleTurn(
			state,
			{ message: 'anything', remote },
			{ catalog: defaultCatalog, clock: { openedAt: 0, now: 0 } }
		);
		expect(turn.state.plan).toEqual(state.plan);
		expect(turn.changes).toEqual([]);
		expect(turn.trace.changes).toBe(0);
		expect(FORBIDDEN_REPLY.test(turn.turn.reply.text)).toBe(false);
		const codes = remote.trace.dropped.map((d) => `${d.place}:${d.code}`);
		for (const expected of [
			'theme:unknown_value',
			'cardFields:unknown_value',
			'cardFields:empty_list',
			'sections:unknown_value',
			'specPrefs:not_in_category',
			'filters.shops:unknown_shop',
			'filters.maxPrice:model_number',
			'priorities:model_number',
			'query:search_has_number',
			'unknown:unknown_field',
			'productId:ignored_for_intent'
		])
			expect(codes).toContain(expected);
		const output = JSON.stringify(turn);
		expect(output).not.toContain('fake-product-123');
		expect(output).not.toContain('totally-real-shop');
		expect(output).not.toContain('hacker');
		expect(output).not.toContain('฿1');
		expect(turn.ranked.map((row) => row.product.price)).toEqual(
			handleTurn(
				state,
				{ message: 'hello' },
				{ catalog: defaultCatalog, clock: { openedAt: 0, now: 0 } }
			).ranked.map((row) => row.product.price)
		);
		expect(JSON.stringify(defaultCatalog)).toBe(catalogBefore);
	});
});
