import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
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

it('continues the interview offline when the service fails', async () => {
	const oncomplete = vi.fn();
	const oncancel = vi.fn();
	vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
	const screen = await render(InterviewConversation, { locale: 'en', oncomplete, oncancel });

	await screen.getByRole('button', { name: 'Start interview' }).click();
	await expect
		.element(screen.getByRole('status'))
		.toHaveTextContent('Live interview unavailable — continuing with the offline choices.');
	await expect.element(screen.getByText(/What are you here to do/)).toBeVisible();

	const field = screen.getByRole('textbox', { name: 'Your answer' });
	const reply = screen.getByRole('button', { name: 'Reply' });
	for (const answer of ['compare', 'specs', 'value', 'large text']) {
		await field.fill(answer);
		await userEvent.click(reply);
	}

	expect(oncomplete).toHaveBeenCalledExactlyOnceWith({
		goal: 'compare',
		evidence: 'specs',
		priority: 'value',
		reading: 'large'
	});
	expect(oncancel).not.toHaveBeenCalled();
});

it('keeps the explicit offline choices available when the service fails', async () => {
	const oncomplete = vi.fn();
	const oncancel = vi.fn();
	vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
	const screen = await render(InterviewConversation, { locale: 'en', oncomplete, oncancel });

	await screen.getByRole('button', { name: 'Start interview' }).click();
	await userEvent.click(screen.getByRole('button', { name: 'Use offline choices' }));

	expect(oncancel).toHaveBeenCalledOnce();
	expect(oncomplete).not.toHaveBeenCalled();
});
