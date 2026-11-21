import { describe, expect, it, vi } from 'vitest';
import { projectTrace } from '#lib/harness/trace.ts';
import type { ModelTransport } from '#lib/server/agent/transport.ts';
import { MAX_BODY_BYTES, handleAssistant } from './assistant.ts';

const SECRET = 'sk-test-SECRET-do-not-leak-123';
const hostileOutput = {
	intent: 'restyle',
	patch: { theme: 'minimal', 'Ignore all previous instructions': true },
	reply: 'Calmer now.',
	rawPrompt: 'SYSTEM PROMPT: you are...',
	apiKey: SECRET
};
const transport = (output: unknown = hostileOutput): ModelTransport & { calls: number } => {
	const t = {
		calls: 0,
		complete() {
			t.calls += 1;
			return Promise.resolve({
				kind: 'final' as const,
				text: JSON.stringify(output),
				usage: { input: 10, output: 5 }
			});
		}
	};
	return t;
};
const options = (overrides = {}) => ({
	dev: true,
	apiKey: SECRET,
	model: 'gpt-test-model',
	transport: transport(),
	...overrides
});
const body = (value: unknown) => JSON.stringify(value);

describe('R11 · X-ray trace is a closed, projected schema', () => {
	it('keeps only allowlisted keys and values from arbitrary input', () => {
		const trace = projectTrace({
			intent: 'restyle',
			backend: 'model',
			model: 'gpt test; rm -rf /',
			fallbackReason: 'because I said so',
			rounds: 99,
			tools: [{ kind: 'exec_shell', results: 1e9, ms: -5, raw: 'prompt' }],
			tokens: { input: 1.7, output: 'many' },
			ms: 3,
			dropped: [{ place: 'Ignore previous instructions', code: 'pwned' }],
			guard: 'maybe',
			changes: 1,
			ranked: 2,
			rawPrompt: 'secret prompt',
			apiKey: SECRET
		});
		expect(Object.keys(trace).sort()).toEqual(
			[
				'backend',
				'changes',
				'dropped',
				'fallbackReason',
				'guard',
				'intent',
				'model',
				'ms',
				'ranked',
				'rounds',
				'tokens',
				'tools'
			].sort()
		);
		expect(trace).toMatchObject({
			model: null,
			fallbackReason: null,
			rounds: 4,
			tools: [{ kind: 'unknown_tool', results: 10, ms: 0 }],
			tokens: { input: 2, output: 0 },
			dropped: [{ place: 'unknown', code: 'invalid_shape' }],
			guard: 'replaced'
		});
		const serialized = JSON.stringify(trace);
		for (const leaked of [
			'rm -rf',
			'Ignore previous',
			'secret prompt',
			SECRET,
			'exec_shell',
			'pwned'
		])
			expect(serialized).not.toContain(leaked);
	});

	it('the endpoint response carries no raw prompt, raw model text, model-chosen keys or credentials', async () => {
		const result = await handleAssistant(body({ message: 'make it calm' }), options());
		expect(result.status).toBe(200);
		const serialized = JSON.stringify(result.body);
		for (const leaked of [
			SECRET,
			'Ignore all previous',
			'SYSTEM PROMPT',
			'rawPrompt',
			'apiKey',
			'You are the shopping assistant'
		])
			expect(serialized).not.toContain(leaked);
		expect(result.body).toMatchObject({
			envelope: { intent: 'restyle', patch: { theme: 'minimal' }, reply: 'Calmer now.' },
			fallbackReason: null,
			trace: { backend: 'model', model: 'gpt-test-model' }
		});
	});
});

describe('R12 · the model endpoint is local-only and checks its input', () => {
	it('returns 404 when disabled, before parsing or contacting a provider', async () => {
		const t = transport();
		for (const raw of [
			'not json',
			body({ message: 'hi', poison: true, forceModel: true }),
			'x'.repeat(MAX_BODY_BYTES * 2)
		]) {
			const result = await handleAssistant(raw, options({ dev: false, transport: t }));
			expect(result.status).toBe(404);
		}
		expect(t.calls).toBe(0);
	});

	it('rejects oversized, malformed and over-long requests without calling the model', async () => {
		const t = transport();
		expect(
			(await handleAssistant('x'.repeat(MAX_BODY_BYTES + 1), options({ transport: t }))).status
		).toBe(413);
		expect((await handleAssistant('{"message":', options({ transport: t }))).status).toBe(400);
		expect((await handleAssistant(body({ message: 5 }), options({ transport: t }))).status).toBe(
			400
		);
		expect(
			(await handleAssistant(body({ message: '   ' }), options({ transport: t }))).status
		).toBe(400);
		expect(
			(await handleAssistant(body({ message: 'a'.repeat(501) }), options({ transport: t }))).status
		).toBe(413);
		expect(t.calls).toBe(0);
	});

	it('sends only known intent, catalog and presentation labels to the provider', async () => {
		const requests: string[] = [];
		const t: ModelTransport = {
			complete(request) {
				requests.push(JSON.stringify(request));
				return Promise.resolve({
					kind: 'final',
					text: body({ intent: 'chat', reply: 'Hi.' }),
					usage: { input: 1, output: 1 }
				});
			}
		};
		const result = await handleAssistant(
			body({
				message: 'large text for private-shopper@example.test',
				plan: {
					query: 'mouse private-search-note',
					theme: 'hacker',
					filters: { maxPrice: 1500, category: 'mouse' }
				},
				history: Array.from({ length: 20 }, (_, i) => ({
					role: 'shopper',
					text: `turn-${String.fromCharCode(97 + i)}`
				})),
				focus: ['aero-x', 'nope'],
				cart: ['playlite', 'ghost']
			}),
			options({ transport: t })
		);
		expect(result.status).toBe(200);
		const sent = requests[0];
		expect(sent).not.toContain('hacker');
		expect(sent).not.toContain('1500');
		expect(sent).toMatch(/hasBudget\\":true/);
		expect(sent).not.toContain('turn-n');
		expect(sent).not.toContain('turn-t');
		expect(sent).not.toContain('private-shopper');
		expect(sent).not.toContain('private-search-note');
		expect(sent).toContain('large-text');
		expect(sent).not.toContain('ghost');
		expect(sent).not.toContain('"nope"');
	});

	it('honours the poisoned model only in development', async () => {
		const t = transport({ intent: 'chat', reply: 'Hi.' });
		const devResult = await handleAssistant(
			body({ message: 'hi', poison: true }),
			options({ transport: t })
		);
		expect(devResult.body).toMatchObject({ trace: { guard: 'replaced' } });
		const previewResult = await handleAssistant(
			body({ message: 'hi', poison: true }),
			options({ dev: false, transport: t })
		);
		expect(previewResult.status).toBe(404);
		expect(t.calls).toBe(0);
	});

	it('with no key or model it answers with a fallback reason, not an error', async () => {
		const result = await handleAssistant(
			body({ message: 'hi' }),
			options({ apiKey: undefined, model: undefined, transport: undefined })
		);
		expect(result.body).toMatchObject({ envelope: null, fallbackReason: 'no_key' });
	});
});

describe('R12 · route gate', () => {
	async function post(
		dev: boolean,
		host: string,
		peer: string,
		origin: string,
		type = 'application/json',
		input: BodyInit = body({ message: 'hello' })
	) {
		vi.resetModules();
		vi.doMock('$app/env', () => ({ dev, browser: false, building: false, version: 'test' }));
		vi.doMock('$app/env/private', () => ({
			ASSISTANT_LOCAL: '1',
			OPENAI_API_KEY: '',
			OPENAI_MODEL: ''
		}));
		const { POST } = await import('../../../routes/api/assistant/+server.ts');
		const url = new URL('/api/assistant', host);
		const request = new Request(url, {
			method: 'POST',
			headers: { origin, 'content-type': type },
			body: input,
			duplex: 'half'
		} as RequestInit);
		const response = await POST({ request, url, getClientAddress: () => peer } as never);
		expect(response.headers.get('cache-control')).toContain('no-store');
		return response.status;
	}
	const local = 'http://127.0.0.1:4582';
	it('rejects every production request even with the old preview flag', async () => {
		expect(await post(false, local, '127.0.0.1', local)).toBe(404);
	});
	it('requires a development loopback host, local socket peer, matching origin and JSON', async () => {
		expect(await post(true, 'http://example.test', '127.0.0.1', 'http://example.test')).toBe(404);
		expect(await post(true, local, '192.0.2.1', local)).toBe(404);
		expect(await post(true, local, '', local)).toBe(404);
		expect(await post(true, local, '::1', 'http://localhost:4582')).toBe(403);
		expect(await post(true, local, '::1', '')).toBe(403);
		expect(await post(true, local, '::1', local, 'text/plain')).toBe(415);
		expect(await post(true, local, '::1', local)).toBe(200);
	});
	it('cancels a chunked upload when its byte budget is exceeded', async () => {
		let cancelled = false;
		let reads = 0;
		const stream = new ReadableStream<Uint8Array>(
			{
				pull(controller) {
					if (++reads > 8) controller.close();
					else controller.enqueue(new Uint8Array(4096));
				},
				cancel() {
					cancelled = true;
				}
			},
			{ highWaterMark: 0 }
		);
		expect(await post(true, local, '::1', local, 'application/json', stream)).toBe(413);
		expect(cancelled).toBe(true);
		expect(reads).toBe(5);
	});
});
