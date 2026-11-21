import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { afterEach, expect, it, vi } from 'vitest';
import Chat from './Chat.svelte';

afterEach(async () => {
	await page.viewport(1440, 900);
});

it('sends suggestions and typed messages through the same callback, and respects pending and IME', async () => {
	await page.viewport(1440, 900);
	const send = vi.fn();
	const screen = await render(Chat, { locale: 'en', messages: [], pending: false, onSend: send });
	await screen.getByRole('button', { name: 'ขอแบบเรียบๆ ดูสเปกก่อน' }).click();
	expect(send).toHaveBeenCalledExactlyOnceWith('ขอแบบเรียบๆ ดูสเปกก่อน');

	const input = screen.getByRole('textbox', { name: 'Message' });
	await input.fill('ขอแบบเรียบง่าย');
	input.element().dispatchEvent(
		new KeyboardEvent('keydown', {
			key: 'Enter',
			isComposing: true,
			bubbles: true,
			cancelable: true
		})
	);
	expect(send).toHaveBeenCalledTimes(1);

	await screen.rerender({ pending: true });
	await expect.element(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
	await screen.rerender({ pending: false });
	await userEvent.keyboard('{Enter}');
	expect(send).toHaveBeenLastCalledWith('ขอแบบเรียบง่าย');
	expect(send).toHaveBeenCalledTimes(2);
});

it('opens the chat as a phone sheet and returns focus after Escape', async () => {
	await page.viewport(390, 844);
	const screen = await render(Chat, {
		locale: 'en',
		messages: [],
		pending: false,
		onSend: vi.fn()
	});
	const trigger = screen.getByRole('button', { name: 'Chat with the assistant' });
	await trigger.click();
	const dialog = screen.getByRole('dialog', { name: 'Chat with the assistant' });
	const input = dialog.getByRole('textbox', { name: 'Message' });
	await expect.element(input).toHaveFocus();
	await userEvent.keyboard('{Escape}');
	expect(screen.container.querySelector('dialog')?.open).toBe(false);
	await expect.element(trigger).toHaveFocus();
});

it('scrolls to a reply received while the phone sheet was closed', async () => {
	await page.viewport(390, 844);
	const messages = Array.from({ length: 20 }, (_, index) => ({
		id: String(index),
		role: 'assistant' as const,
		text: 'Here is a previous reply. '.repeat(6)
	}));
	const screen = await render(Chat, {
		locale: 'en',
		messages: [],
		pending: true,
		onSend: vi.fn()
	});
	const trigger = screen.getByRole('button', { name: 'Chat with the assistant' });
	await trigger.click();
	await screen.getByRole('button', { name: 'Close chat' }).click();
	await screen.rerender({
		messages: [...messages, { id: 'new', role: 'assistant', text: 'This just arrived.' }],
		pending: false
	});
	await trigger.click();
	const history = screen.getByRole('log').element();
	const reply = screen.getByText('This just arrived.').element();
	expect(reply.getBoundingClientRect().bottom).toBeLessThanOrEqual(
		history.getBoundingClientRect().bottom
	);
});
