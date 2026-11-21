import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { afterEach, expect, it, vi } from 'vitest';
import InterviewConversation from './InterviewConversation.svelte';

afterEach(() => {
	vi.unstubAllGlobals();
});

it('sends interview answers to the production endpoint and maps only preset IDs', async () => {
	const oncomplete = vi.fn();
	const oncancel = vi.fn();
	const fetchMock = vi.fn().mockResolvedValue(
		Response.json({
			reply: 'I will prepare a comparison view.',
			complete: true,
			answers: {
				goal: 'compare',
				matters: 'quality',
				detail: 'simple',
				help: null,
				access: 'larger-text'
			}
		})
	);
	vi.stubGlobal('fetch', fetchMock);
	const screen = await render(InterviewConversation, { locale: 'en', oncomplete, oncancel });

	await screen.getByRole('button', { name: 'Start interview' }).click();

	expect(fetchMock).toHaveBeenCalledOnce();
	expect(fetchMock).toHaveBeenCalledWith(
		'/api/interview',
		expect.objectContaining({ method: 'POST' })
	);
	expect(oncomplete).toHaveBeenCalledExactlyOnceWith({
		goal: 'compare',
		priority: 'durability',
		evidence: 'summary',
		reading: 'large'
	});
	expect(oncancel).not.toHaveBeenCalled();
});

it('offers the offline interview when the service fails', async () => {
	const oncomplete = vi.fn();
	const oncancel = vi.fn();
	vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
	const screen = await render(InterviewConversation, { locale: 'en', oncomplete, oncancel });

	await screen.getByRole('button', { name: 'Start interview' }).click();
	await expect.element(screen.getByRole('alert')).toBeVisible();
	await userEvent.click(screen.getByRole('button', { name: 'Use offline choices' }));

	expect(oncancel).toHaveBeenCalledOnce();
	expect(oncomplete).not.toHaveBeenCalled();
});
