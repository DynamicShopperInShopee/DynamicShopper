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
	enabled: true,
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
			const result = await handleAssistant(raw, options({ enabled: false, transport: t }));
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

	it('re-validates the client plan and caps history, ids and lists', async () => {
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
				message: 'hello',
				plan: { theme: 'hacker', filters: { maxPrice: 1500, category: 'mouse' } },
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
		expect(sent).toContain('turn-t');
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
		expect(previewResult.body).toMatchObject({
			envelope: { intent: 'chat', reply: 'Hi.' },
			trace: { guard: 'passed' }
		});
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
	it('the route returns 404 outside dev unless ASSISTANT_LOCAL=1', async () => {
		vi.resetModules();
		vi.doMock('$app/env', () => ({ dev: false, browser: false, building: false, version: 'test' }));
		vi.doMock('$app/env/private', () => ({
			ASSISTANT_LOCAL: undefined,
			OPENAI_API_KEY: SECRET,
			OPENAI_MODEL: 'm'
		}));
		const { POST } = await import('../../../routes/api/assistant/+server.ts');
		const request = new Request('http://localhost/api/assistant', {
			method: 'POST',
			body: body({ message: 'hi', poison: true })
		});
		await expect(POST({ request } as never)).rejects.toMatchObject({ status: 404 });
		vi.doUnmock('$app/env');
		vi.doUnmock('$app/env/private');
	});
});
