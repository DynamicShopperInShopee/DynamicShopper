import { toHarness, fromHarness } from './website-adapter.ts';
import { describe, it, expect, vi } from 'vitest';
import { HarnessContext } from './context.svelte';
import { POISONED_ENVELOPE } from '#lib/server/agent/poison.ts';
import { handleAssistant } from '#lib/server/handlers/assistant.ts';
import { FORBIDDEN_REPLY, standardPlan } from '#lib/harness/index.ts';

const noKey: typeof fetch = async (_input, init) => {
	const r = await handleAssistant(typeof init?.body === 'string' ? init.body : '', {
		dev: true,
		apiKey: undefined,
		model: undefined
	});
	return Response.json(r.body, { status: r.status });
};
describe('storefront harness integration', () => {
	it('walks the offline search, restyle, budget, citation and optimizer journey', async () => {
		const c = new HarnessContext();
		c.patch({ query: 'gaming mouse' });
		await c.send('ขอแบบเรียบๆ ดูสเปกก่อน', noKey);
		expect(c.state.plan).toMatchObject({ theme: 'minimal', layout: 'table' });
		await c.send('I care about battery and light weight, under 1500 baht', noKey);
		expect(c.ranked.map((r) => r.product.id)).toEqual(['aero-x', 'nova-lite', 'vortex-w']);
		expect(toHarness(fromHarness(c.state.plan))).toEqual(c.state.plan);
		const plan = c.state.plan;
		await c.send('does the battery last all day?', noKey);
		expect(c.last?.turn).toMatchObject({ intent: 'ask' });
		expect(c.state.plan).toBe(plan);
		c.focus('aero-x');
		await c.send('cheapest way to get this?', noKey);
		expect(c.last?.deal).toEqual(c.deal(['aero-x']));
		expect(c.state.plan).toBe(plan);
		expect(c.last?.backend).toBe('offline');
	});
	it('a poisoned server response changes neither facts nor plan', async () => {
		const c = new HarnessContext();
		const before = c.state.plan;
		const products = c.ranked.map((r) => [r.product.id, r.product.price]);
		c.poison = true;
		await c.send('hello', noKey);
		expect(c.last?.trace.guard).toBe('replaced');
		expect(c.last?.trace.dropped.length).toBeGreaterThan(0);
		expect(c.state.plan).toEqual(before);
		expect(c.changes).toEqual([]);
		expect(c.ranked.map((r) => [r.product.id, r.product.price])).toEqual(products);
		expect(c.last?.turn.reply.text).not.toMatch(FORBIDDEN_REPLY);
	});
	it('revalidates malicious remote answers in the browser and honors language locks', async () => {
		const c = new HarnessContext();
		c.patch({ language: 'th' });
		c.patch({ language: 'en' });
		await c.send('ซื้อให้แม่', noKey);
		expect(c.state.plan).toMatchObject({ language: 'en', theme: 'large-print' });
		expect(c.last?.trace.dropped).toContainEqual({ place: 'language', code: 'explicit_wins' });
		const before = c.state.plan;
		await c.send('hello', () => Promise.resolve(Response.json({ envelope: POISONED_ENVELOPE })));
		expect(c.state.plan).toEqual(before);
		expect(c.last?.trace.guard).toBe('replaced');
	});
	it('keeps the store search and previous conversation out of the local request body', async () => {
		const c = new HarnessContext();
		const payloads: Array<Record<string, unknown>> = [];
		c.patch({ query: 'mouse synthetic-search-note' });
		const fetcher: typeof fetch = async (_url, init) => {
			payloads.push(JSON.parse(String(init?.body)));
			return Response.json({ envelope: { intent: 'chat', reply: 'Hello.' } });
		};
		await c.send('synthetic-first-turn', fetcher);
		await c.send('large text', fetcher);
		expect(payloads).toHaveLength(2);
		expect(payloads[1].message).toBe('large text');
		expect(payloads[1]).not.toHaveProperty('history');
		expect(JSON.stringify(payloads)).not.toContain('synthetic-search-note');
		expect(JSON.stringify(payloads[1])).not.toContain('synthetic-first-turn');
	});
	it('explicit controls win over an in-flight reply', async () => {
		const c = new HarnessContext();
		let resolve!: (r: Response) => void;
		const pending = c.send(
			'minimal',
			() =>
				new Promise((r) => {
					resolve = r;
				})
		);
		c.patch({ theme: 'vibrant' });
		resolve(
			Response.json({
				envelope: { intent: 'restyle', patch: { theme: 'minimal' }, reply: 'Done.' }
			})
		);
		await pending;
		expect(c.state.plan.theme).toBe('vibrant');
		expect(c.pending).toBe(false);
		expect(c.last).toBeUndefined();
	});
	it('network errors and unavailable endpoints fall back; forced offline never fetches', async () => {
		const c = new HarnessContext();
		await c.send('minimal', () => Promise.reject(Error('offline')));
		expect(c.state.plan.theme).toBe('minimal');
		expect(c.last?.trace.fallbackReason).toBe('api_error');
		c.reset();
		await c.send('minimal', () => Promise.resolve(new Response(null, { status: 404 })));
		expect(c.last?.backend).toBe('offline');

		const fetcher = vi.fn();
		c.forceOffline = true;
		await c.send('large text', fetcher);
		expect(fetcher).not.toHaveBeenCalled();
		expect(c.last?.trace.fallbackReason).toBe('forced_offline');
	});
	it('repeated comparison proposes a reversible change without applying it', () => {
		const c = new HarnessContext();
		for (let i = 0; i < 3; i++) c.signal('open_compare');
		expect(c.state.plan).toEqual(standardPlan);
		expect(c.state.suggestions).toHaveLength(1);
		c.accept('open_compare');
		expect(c.state.plan.layout).toBe('table');
		c.undo();
		expect(c.state.plan.layout).toBe('grid');
	});
	it('untrusted controls and IDs cannot enter the state', () => {
		const c = new HarnessContext();
		c.patch({ theme: 'hacker', layout: 'list', filters: { maxPrice: -4 } });
		c.focus('fake-product');
		expect(c.state.plan.theme).toBe('standard');
		expect(c.state.plan.layout).toBe('list');
		expect(c.state.focus).toEqual([]);
	});
});
