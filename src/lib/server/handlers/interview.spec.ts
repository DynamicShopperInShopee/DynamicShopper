import { describe, expect, it, vi } from 'vitest';
import { handleInterview } from './interview';

const body = {
	locale: 'en',
	history: [{ role: 'assistant', content: 'What matters most to you?' }],
	message: 'I want to compare products.'
};
const answers = {
	goal: 'compare',
	matters: null,
	detail: null,
	help: null,
	access: null
};

function request(value: unknown = body) {
	return new Request('https://shop.example/api/interview', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(value)
	});
}

function completed(reply = 'Would you like a compact comparison?') {
	return Response.json({
		status: 'completed',
		output: [
			{
				type: 'message',
				content: [
					{ type: 'output_text', text: JSON.stringify({ reply, complete: false, answers }) }
				]
			}
		]
	});
}

describe('production interview handler', () => {
	it('calls OpenAI for a valid request on a production host and returns a safe response', async () => {
		const provider = vi.fn<typeof fetch>().mockResolvedValue(completed());
		const response = await handleInterview(request(), { apiKey: 'server-only-test-key' }, provider);

		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual({
			reply: 'Would you like a compact comparison?',
			complete: false,
			answers
		});
		expect(provider).toHaveBeenCalledOnce();
		const [target, init] = provider.mock.calls[0];
		expect(target).toBe('https://api.openai.com/v1/responses');
		expect(init?.headers).toMatchObject({ Authorization: 'Bearer server-only-test-key' });
		if (typeof init?.body !== 'string') throw new Error('expected provider JSON request');
		const providerBody = JSON.parse(init.body) as { input: unknown; store: boolean };
		expect(providerBody).toMatchObject({
			input: [...body.history, { role: 'user', content: body.message }],
			store: false
		});
		expect(Object.keys(providerBody).sort()).toEqual(
			['input', 'instructions', 'max_output_tokens', 'model', 'store', 'text'].sort()
		);
	});

	it('keeps the offline fallback when there is no configured key', async () => {
		const provider = vi.fn<typeof fetch>();
		const response = await handleInterview(request(), {}, provider);

		expect(response.status).toBe(503);
		expect(provider).not.toHaveBeenCalled();
	});
});
