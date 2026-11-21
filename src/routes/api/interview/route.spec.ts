import { expect, it, vi } from 'vitest';
import type { RequestEvent } from './$types';
import { POST } from './+server';

vi.mock('$app/env/private', () => ({
	OPENAI_API_KEY: 'synthetic-interview-key',
	OPENAI_MODEL: 'test-model'
}));

it('keeps the retired interview endpoint away from providers even with a configured key', async () => {
	const provider = vi
		.spyOn(globalThis, 'fetch')
		.mockResolvedValue(new Response(null, { status: 503 }));
	try {
		for (const origin of ['https://shop.example', 'http://localhost:5173']) {
			const url = new URL('/api/interview', origin);
			const request = new Request(url, {
				method: 'POST',
				headers: { origin, 'content-type': 'application/json' },
				body: JSON.stringify({ locale: 'en', history: [], message: 'Synthetic private message' })
			});
			const response = await POST({ url, request } as RequestEvent);
			expect(response.status).toBe(410);
			expect(response.headers.get('cache-control')).toBe('no-store');
		}
		expect(provider).not.toHaveBeenCalled();
	} finally {
		provider.mockRestore();
	}
});
