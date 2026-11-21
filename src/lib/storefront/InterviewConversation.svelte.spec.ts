import { render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import InterviewConversation from './InterviewConversation.svelte';

afterEach(() => vi.unstubAllGlobals());

it('keeps typed conversation on device and returns only reviewed choice IDs', async () => {
	const network = vi.fn(() => {
		throw new Error('Unexpected network request');
	});
	vi.stubGlobal('fetch', network);
	const oncomplete = vi.fn();
	const screen = await render(InterviewConversation, {
		locale: 'en',
		oncomplete,
		oncancel: vi.fn()
	});
	const input = screen.getByRole('textbox', { name: 'Your answer' });

	await input.fill('A synthetic shopper note with no matching choice');
	await screen.getByRole('button', { name: 'Reply', exact: true }).click();
	await expect
		.element(screen.getByRole('status'))
		.toHaveTextContent('Choose one of the listed replies, or skip this question.');
	expect(oncomplete).not.toHaveBeenCalled();

	await input.fill('compare');
	await screen.getByRole('button', { name: 'Reply', exact: true }).click();
	await screen.getByRole('button', { name: 'Specs', exact: true }).click();
	await screen.getByRole('button', { name: 'Skip this question' }).click();
	await screen.getByRole('button', { name: 'Large text', exact: true }).click();

	expect(oncomplete).toHaveBeenCalledExactlyOnceWith({
		goal: 'compare',
		evidence: 'specs',
		reading: 'large'
	});
	expect(network).not.toHaveBeenCalled();
});

it('supports Thai replies and returns to the choices without applying a draft', async () => {
	const network = vi.fn();
	vi.stubGlobal('fetch', network);
	const oncomplete = vi.fn();
	const oncancel = vi.fn();
	const screen = await render(InterviewConversation, { locale: 'th', oncomplete, oncancel });
	await screen.getByRole('textbox', { name: 'คำตอบของคุณ' }).fill('เปรียบเทียบ');
	await screen.getByRole('button', { name: 'ตอบ', exact: true }).click();
	await expect.element(screen.getByRole('heading', { name: 'ดูอะไรแล้วตัดสินใจง่ายขึ้น?' })).toBeVisible();
	await screen.getByRole('button', { name: 'กลับไปเลือกคำตอบ' }).click();
	expect(oncancel).toHaveBeenCalledOnce();
	expect(oncomplete).not.toHaveBeenCalled();
	expect(network).not.toHaveBeenCalled();
});
