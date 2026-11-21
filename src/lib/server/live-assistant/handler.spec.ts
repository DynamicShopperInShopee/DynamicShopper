import { describe, expect, it, vi } from 'vitest';
import { projectLiveHints } from '../../personalization/live';
import { handleLocalAssistant } from './handler';

const url = new URL('http://localhost:5173/api/local-assistant');
const hints = projectLiveHints('use a compact list');
const options = { enabled: true, peer: '::1', apiKey: 'test-private-key' };

function request(body: string, origin = url.origin, type = 'application/json') {
	return new Request(url, {
		method: 'POST',
		headers: { origin, 'content-type': type },
		body
	});
}

function providerOutput(value: unknown) {
	return Response.json({
		status: 'completed',
		output: [
			{ type: 'reasoning' },
			{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }
		]
	});
}

describe('local assistant transport', () => {
	it('sends only finite hints and returns only independently validated plan fields', async () => {
		const provider = vi
			.fn<typeof fetch>()
			.mockResolvedValue(
				providerOutput({ layout: 'list', theme: '฿1', price: 1, reply: 'raw provider text' })
			);
		const response = await handleLocalAssistant(
			request(JSON.stringify({ hints })),
			url,
			options,
			provider
		);
		expect(hints.length).toBeGreaterThan(0);
		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual({
			patch: { layout: 'list' },
			model: 'gpt-5-mini',
			rejected: true
		});
		expect(provider).toHaveBeenCalledTimes(1);
		const [target, init] = provider.mock.calls[0];
		expect(target).toBe('https://api.openai.com/v1/responses');
		expect(init).toMatchObject({
			headers: { Authorization: 'Bearer test-private-key' },
			redirect: 'error'
		});
		expect(init?.signal).toBeInstanceOf(AbortSignal);
		if (typeof init?.body !== 'string') throw new Error('expected provider JSON request');
		const providerBody = JSON.parse(init.body) as unknown;
		expect(providerBody).toMatchObject({
			input: JSON.stringify(hints),
			store: false,
			max_output_tokens: 512,
			text: { format: { strict: true } }
		});
	});

	it('stays unavailable in production and off loopback even when an Origin matches', async () => {
		const provider = vi.fn<typeof fetch>();
		const body = JSON.stringify({ hints });
		const publicUrl = new URL('http://store.example/api/local-assistant');
		expect(
			(await handleLocalAssistant(request(body), url, { ...options, enabled: false }, provider))
				.status
		).toBe(404);
		expect(
			(await handleLocalAssistant(request(body, publicUrl.origin), publicUrl, options, provider))
				.status
		).toBe(404);
		expect(
			(await handleLocalAssistant(request(body), url, { ...options, peer: '192.0.2.1' }, provider))
				.status
		).toBe(404);
		expect(provider).not.toHaveBeenCalled();
	});

	it('rejects cross-origin, non-JSON, oversized and free-form inputs before a provider call', async () => {
		const provider = vi.fn<typeof fetch>();
		const body = JSON.stringify({ hints });
		for (const [invalid, status] of [
			[request(body, 'http://localhost:1234'), 403],
			[request(body, url.origin, 'text/plain'), 415],
			[request(' '.repeat(8192) + body), 413],
			[request(JSON.stringify({ hints, message: 'raw text' })), 400],
			[request(JSON.stringify({ hints: ['raw text'] })), 400]
		] as const) {
			expect((await handleLocalAssistant(invalid, url, options, provider)).status).toBe(status);
		}
		expect(provider).not.toHaveBeenCalled();
	});

	it('does not call the provider without a key or relay provider errors', async () => {
		const provider = vi
			.fn<typeof fetch>()
			.mockResolvedValue(new Response('private details', { status: 401 }));
		const body = JSON.stringify({ hints });
		expect(
			(
				await handleLocalAssistant(
					request(body),
					url,
					{ enabled: true, peer: options.peer },
					provider
				)
			).status
		).toBe(503);
		expect(provider).not.toHaveBeenCalled();

		const response = await handleLocalAssistant(request(body), url, options, provider);
		expect(response.status).toBe(502);
		expect(await response.json()).toEqual({ error: 'unavailable' });
	});

	it('reports tokens without estimating prices for other configured models', async () => {
		const onUsage = vi.fn(() => {
			throw new Error('terminal logging unavailable');
		});
		const provider = vi.fn<typeof fetch>().mockResolvedValue(
			Response.json({
				status: 'completed',
				output: [
					{ type: 'message', content: [{ type: 'output_text', text: '{"layout":"list"}' }] }
				],
				usage: { input_tokens: 200, output_tokens: 40 }
			})
		);
		const response = await handleLocalAssistant(
			request(JSON.stringify({ hints })),
			url,
			{ ...options, model: 'another-model', onUsage },
			provider
		);
		expect(onUsage).toHaveBeenCalledExactlyOnceWith({
			inputTokens: 200,
			cachedInputTokens: 0,
			outputTokens: 40,
			estimatedUsd: null
		});
		expect(await response.json()).toEqual({ patch: { layout: 'list' }, model: 'another-model' });
	});

	it('skips a paid call if the shopper request has already been cancelled', async () => {
		const provider = vi.fn<typeof fetch>();
		const cancelled = new Request(request(JSON.stringify({ hints })), {
			signal: AbortSignal.abort()
		});
		expect((await handleLocalAssistant(cancelled, url, options, provider)).status).toBe(502);
		expect(provider).not.toHaveBeenCalled();
	});

	it('preserves rejection evidence when every proposed field is invalid', async () => {
		const provider = vi
			.fn<typeof fetch>()
			.mockResolvedValue(providerOutput({ layout: 'foreign', reply: '฿1' }));
		const response = await handleLocalAssistant(
			request(JSON.stringify({ hints })),
			url,
			options,
			provider
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ patch: {}, model: 'gpt-5-mini', rejected: true });
	});

	it('falls back on usable responses with no proposal', async () => {
		const provider = vi.fn<typeof fetch>().mockResolvedValue(providerOutput({ layout: null }));
		const response = await handleLocalAssistant(
			request(JSON.stringify({ hints })),
			url,
			options,
			provider
		);
		expect(response.status).toBe(502);
		expect(await response.json()).toEqual({ error: 'unavailable' });
	});

	it('records provider usage for a fallback without returning billing data to the browser', async () => {
		const onUsage = vi.fn();
		const provider = vi.fn<typeof fetch>().mockResolvedValue(
			Response.json({
				status: 'incomplete',
				usage: {
					input_tokens: 200,
					input_tokens_details: { cached_tokens: 100 },
					output_tokens: 40,
					output_tokens_details: { reasoning_tokens: 20 }
				}
			})
		);
		const response = await handleLocalAssistant(
			request(JSON.stringify({ hints })),
			url,
			{ ...options, onUsage },
			provider
		);
		expect(onUsage).toHaveBeenCalledExactlyOnceWith({
			inputTokens: 200,
			cachedInputTokens: 100,
			outputTokens: 40,
			estimatedUsd: 0.0001075
		});
		expect(response.status).toBe(502);
		expect(await response.json()).toEqual({ error: 'unavailable' });
	});

	it('returns fallback when the provider reaches the request deadline', async () => {
		const deadline = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(AbortSignal.abort());
		try {
			const provider = vi
				.fn<typeof fetch>()
				.mockImplementation((_url, init) =>
					init?.signal?.aborted
						? Promise.reject(new Error('expired'))
						: Promise.resolve(providerOutput({ layout: 'list' }))
				);
			const response = await handleLocalAssistant(
				request(JSON.stringify({ hints })),
				url,
				options,
				provider
			);
			expect(deadline).toHaveBeenCalledWith(6500);
			expect(response.status).toBe(502);
			expect(await response.json()).toEqual({ error: 'unavailable' });
		} finally {
			deadline.mockRestore();
		}
	});

	it('uses the default model for unsafe config and ignores the provider model label', async () => {
		const provider = vi.fn<typeof fetch>().mockResolvedValue(
			Response.json({
				model: 'provider-only data',
				status: 'completed',
				output: [{ type: 'message', content: [{ type: 'output_text', text: '{"layout":"list"}' }] }]
			})
		);
		const response = await handleLocalAssistant(
			request(JSON.stringify({ hints })),
			url,
			{ ...options, model: options.apiKey },
			provider
		);
		expect(await response.json()).toEqual({ patch: { layout: 'list' }, model: 'gpt-5-mini' });
	});
});
