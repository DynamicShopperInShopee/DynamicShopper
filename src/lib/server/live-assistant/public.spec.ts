import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { expect, it, vi } from 'vitest';
import { reserveDemoCall } from '../db/demo-assistant';
import type { Database as AppDatabase } from '../db';
import { handlePublicAssistant } from './handler';

const url = new URL('https://demo.example/api/storefront-assistant');
function makeRequest(value: unknown) {
	return new Request(url, {
		method: 'POST',
		headers: { origin: url.origin, 'content-type': 'application/json' },
		body: JSON.stringify(value)
	});
}

it('starts on an existing database and atomically spaces and caps all callers across restarts', async () => {
	const directory = mkdtempSync(join(process.cwd(), '.demo-budget-test-'));
	const path = join(directory, 'demo.sqlite');
	const first = new Database(path);
	const second = new Database(path);
	try {
		first.exec('CREATE TABLE shop (id INTEGER PRIMARY KEY)');
		const db = drizzle(first) as unknown as AppDatabase;
		const other = drizzle(second) as unknown as AppDatabase;
		const start = 100.875;
		const initial = await Promise.all([reserveDemoCall(db, start), reserveDemoCall(other, start)]);
		expect(initial.sort()).toEqual([false, true]);
		expect(await reserveDemoCall(other, start + 2.999)).toBe(false);
		for (let slot = 1; slot < 60; slot++) {
			const now = start + 3 * slot;
			const outcomes = await Promise.all([reserveDemoCall(db, now), reserveDemoCall(other, now)]);
			expect(outcomes.sort()).toEqual([false, true]);
		}
		first.close();
		second.close();
		const restarted = new Database(path);
		try {
			restarted.exec(readFileSync('drizzle/0000_demo_assistant_budget.sql', 'utf8'));
			const db = drizzle(restarted) as unknown as AppDatabase;
			expect(await reserveDemoCall(db, start + 180)).toBe(false);
			expect(restarted.prepare('SELECT remaining FROM demo_assistant_budget').all()).toEqual([
				{ remaining: 0 }
			]);
		} finally {
			restarted.close();
		}
	} finally {
		if (first.open) first.close();
		if (second.open) second.close();
		rmSync(directory, { recursive: true, force: true });
	}
});

it('uses database time and honors the existing remaining allowance', async () => {
	const sqlite = new Database(':memory:');
	try {
		sqlite.exec(readFileSync('drizzle/0000_demo_assistant_budget.sql', 'utf8'));
		sqlite
			.prepare('INSERT INTO demo_assistant_budget (id, remaining) VALUES (?, 1)')
			.run('public-storefront');
		const db = drizzle(sqlite) as unknown as AppDatabase;
		expect(await reserveDemoCall(db)).toBe(true);
		const state = sqlite
			.prepare('SELECT remaining, last_call FROM demo_assistant_budget')
			.get() as { remaining: number; last_call: number };
		expect(state.remaining).toBe(0);
		expect(state.last_call).toBeGreaterThan(1_000_000_000);
		expect(await reserveDemoCall(db, state.last_call + 10)).toBe(false);
	} finally {
		sqlite.close();
	}
});

it('validates hints before reserving a call and fails closed on a missing or exhausted budget', async () => {
	const provider = vi.fn<typeof fetch>();
	const reserve = vi.fn().mockResolvedValue(false);
	const options = { apiKey: 'test-key', reserve };
	expect(
		(await handlePublicAssistant(makeRequest({ message: 'private text' }), url, options, provider))
			.status
	).toBe(400);
	expect(
		(
			await handlePublicAssistant(
				makeRequest({ hints: ['playful'] }),
				url,
				{ ...options, apiKey: '' },
				provider
			)
		).status
	).toBe(503);
	expect(reserve).not.toHaveBeenCalled();
	expect(
		(await handlePublicAssistant(makeRequest({ hints: ['playful'] }), url, options, provider))
			.status
	).toBe(429);
	reserve.mockRejectedValueOnce(new Error('quota unavailable'));
	expect(
		(await handlePublicAssistant(makeRequest({ hints: ['playful'] }), url, options, provider))
			.status
	).toBe(503);
	expect(provider).not.toHaveBeenCalled();
});

it('a reserved public request returns a checked presentation patch and only passes hints to OpenAI', async () => {
	const provider = vi.fn<typeof fetch>().mockResolvedValue(
		Response.json({
			status: 'completed',
			output: [
				{
					type: 'message',
					content: [{ type: 'output_text', text: JSON.stringify({ theme: 'vibrant', price: 1 }) }]
				}
			]
		})
	);
	const response = await handlePublicAssistant(
		makeRequest({ hints: ['playful'] }),
		url,
		{ apiKey: 'test-key', reserve: async () => true },
		provider
	);
	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({
		patch: { theme: 'vibrant' },
		model: 'gpt-5-mini',
		rejected: true
	});
	expect(JSON.parse(String(provider.mock.calls[0][1]?.body)).input).toBe('["playful"]');
});
it.each([
	[401, 'provider-auth'],
	[403, 'provider-auth'],
	[404, 'model-unavailable'],
	[429, 'provider-limit'],
	[400, 'provider-request'],
	[504, 'timeout'],
	[500, 'runtime'],
	[200, 'invalid-response']
])('classifies provider HTTP %i without returning provider data', async (status, expected) => {
	const provider = vi
		.fn<typeof fetch>()
		.mockResolvedValue(new Response('private provider details', { status: Number(status) }));
	const response = await handlePublicAssistant(
		makeRequest({ hints: ['playful'] }),
		url,
		{ apiKey: 'synthetic', reserve: async () => true },
		provider
	);
	expect(response.status).toBe(502);
	expect(response.headers.get('x-assistant-failure')).toBe(expected);
	expect(await response.json()).toEqual({ error: 'unavailable' });
});

it('keeps requests bounded when the runtime lacks static AbortSignal helpers', async () => {
	const savedTimeout = Object.getOwnPropertyDescriptor(AbortSignal, 'timeout')!;
	const savedAny = Object.getOwnPropertyDescriptor(AbortSignal, 'any')!;
	Object.defineProperty(AbortSignal, 'timeout', { ...savedTimeout, value: undefined });
	Object.defineProperty(AbortSignal, 'any', { ...savedAny, value: undefined });
	vi.useFakeTimers();
	try {
		const provider = vi.fn<typeof fetch>(
			(_url, init) =>
				new Promise((_resolve, reject) => {
					init?.signal?.addEventListener(
						'abort',
						() => reject(new Error('private timeout detail')),
						{ once: true }
					);
				})
		);
		const pending = handlePublicAssistant(
			makeRequest({ hints: ['playful'] }),
			url,
			{ apiKey: 'synthetic', reserve: async () => true },
			provider
		);
		await vi.advanceTimersByTimeAsync(6501);
		const response = await pending;
		expect(response.headers.get('x-assistant-failure')).toBe('timeout');
		expect(await response.json()).toEqual({ error: 'unavailable' });
	} finally {
		Object.defineProperty(AbortSignal, 'timeout', savedTimeout);
		Object.defineProperty(AbortSignal, 'any', savedAny);
		vi.useRealTimers();
	}
});

it('rejects a provider redirect without following the Location or exposing it to the client', async () => {
	const provider = vi.fn<typeof fetch>().mockResolvedValue(
		new Response(null, {
			status: 307,
			headers: { location: 'https://redirect.invalid/private-account-detail' }
		})
	);
	const response = await handlePublicAssistant(
		makeRequest({ hints: ['playful'] }),
		url,
		{ apiKey: 'synthetic', reserve: async () => true },
		provider
	);
	expect(provider).toHaveBeenCalledTimes(1);
	expect(provider.mock.calls[0][0]).toBe('https://api.openai.com/v1/responses');
	expect(provider.mock.calls[0][1]?.redirect).toBe('manual');
	expect(response.status).toBe(502);
	expect(response.headers.get('location')).toBeNull();
	expect(await response.json()).toEqual({ error: 'unavailable' });
});
