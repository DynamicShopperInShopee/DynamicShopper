import { expect, it, vi } from 'vitest';
import { projectLiveHints } from '../personalization/live';
import { defaultPlan } from '../personalization';
import { fillPresentationGaps, requestLivePreview } from './live-preview';

it('sends only projected hints and ignores any unapproved fields in the returned patch', async () => {
	const transport = vi.fn<typeof fetch>(() =>
		Promise.resolve(
			Response.json({
				model: 'gpt-5-mini',
				patch: { theme: 'vibrant', price: 1, maxPrice: 999, query: 'private' },
				response: 'Raw provider text'
			})
		)
	);
	const hints = projectLiveHints('จอยๆ ฿8000 รหัสลับทดสอบ');
	const result = await requestLivePreview(
		'/api/local-assistant',
		hints,
		new AbortController().signal,
		transport
	);
	expect(result).toEqual({ model: 'gpt-5-mini', patch: { theme: 'vibrant' }, rejected: true });
	expect(transport).toHaveBeenCalledTimes(1);
	expect(transport.mock.calls[0]?.[1]?.body).toBe('{"hints":["playful"]}');
});

it('fills only genuine gaps and preserves explicit local or previously locked choices', () => {
	expect(
		fillPresentationGaps(
			{ theme: 'large-print', maxPrice: 1500 },
			{ theme: 'vibrant', locale: 'th', layout: 'grid', density: 'compact' },
			defaultPlan,
			['locale']
		)
	).toEqual({ density: 'compact' });
});

it('keeps the local pipeline available after a provider error or an aborted turn', async () => {
	const transport = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 503 })));
	const controller = new AbortController();
	const hints = projectLiveHints('จอยๆ');
	expect(
		await requestLivePreview('/api/local-assistant', hints, controller.signal, transport)
	).toBeNull();
	controller.abort();
	expect(
		await requestLivePreview('/api/local-assistant', hints, controller.signal, transport)
	).toBeNull();
	expect(transport).toHaveBeenCalledTimes(1);
});
