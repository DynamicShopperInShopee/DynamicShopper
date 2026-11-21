import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { afterEach, expect, it, vi } from 'vitest';
import Chat from './Chat.svelte';
import ShoppingAssistant from './ShoppingAssistant.svelte';
import { Conversation } from './conversation.svelte';
import { defaultPlan, interpretOffline } from '../personalization';

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

it('uses the responsive conversation composer at the storefront entry point', async () => {
	await page.viewport(1440, 900);
	const onSend = vi.fn();
	const screen = await render(ShoppingAssistant, {
		locale: 'en',
		onSend,
		conversation: new Conversation()
	});
	await expect
		.element(screen.getByRole('complementary', { name: 'Chat with the assistant' }))
		.toBeVisible();
	const field = screen.getByRole('textbox', { name: 'Ask the store' });
	expect(field.element().tagName).toBe('TEXTAREA');
	await screen.getByRole('button', { name: 'ขอแบบเรียบๆ ดูสเปกก่อน' }).click();
	expect(onSend).toHaveBeenCalledWith('ขอแบบเรียบๆ ดูสเปกก่อน');
	await page.viewport(390, 844);
	await screen.getByRole('button', { name: 'Chat with the assistant' }).click();
	await expect
		.element(screen.getByRole('dialog').getByRole('textbox', { name: 'Ask the store' }))
		.toHaveFocus();
});

it('keeps the cited value in the reply language when the shopper switches the interface', async () => {
	const conversation = new Conversation();
	const question = 'หม้อหุงข้าวความจุเท่าไหร่';
	conversation.shopper(question, 'th');
	conversation.reply(interpretOffline(question, defaultPlan, 'cooker-one-button'), {
		locale: 'th',
		offline: true,
		changes: []
	});
	await page.viewport(1440, 900);
	const screen = await render(ShoppingAssistant, {
		locale: 'en',
		conversation,
		theme: 'large',
		onSend: vi.fn()
	});
	const cited = screen.getByRole('log').getByRole('link', { name: '1.8 ลิตร' });
	await expect
		.element(cited)
		.toHaveAttribute('href', '/product/cooker-one-button?lang=th&theme=large&view=receipt');
	await expect.element(cited.getByText('1.8 ลิตร')).toHaveAttribute('data-source', 'catalog');
	await expect.element(cited.getByText('1.8 ลิตร')).toHaveAttribute('data-raw', '1.8');
});

it('keeps a failed draft available to retry and announces a local error', async () => {
	await page.viewport(1440, 900);
	const send = vi.fn<() => boolean>().mockReturnValueOnce(false).mockReturnValueOnce(true);
	const screen = await render(Chat, { locale: 'th', messages: [], pending: false, onSend: send });
	const input = screen.getByRole('textbox', { name: 'ข้อความ' });
	await input.fill('ดูสเปกก่อน');
	await screen.getByRole('button', { name: 'ส่ง' }).click();
	await expect.element(screen.getByRole('alert')).toHaveTextContent('ส่งข้อความไม่สำเร็จ ลองส่งอีกครั้งได้');
	await expect.element(input).toHaveValue('ดูสเปกก่อน');
	await screen.getByRole('button', { name: 'ส่ง' }).click();
	await expect.element(input).toHaveValue('');
	expect(screen.container.querySelector('[role="alert"]')).toBeNull();
	expect(send).toHaveBeenCalledTimes(2);
});

it('opens the requested phone conversation once and leaves it closed after Escape', async () => {
	await page.viewport(390, 844);
	const screen = await render(ShoppingAssistant, {
		locale: 'en',
		conversation: new Conversation(),
		onSend: vi.fn(),
		openOnMount: true
	});
	const dialog = screen.getByRole('dialog');
	await expect.element(dialog.getByRole('textbox', { name: 'Ask the store' })).toHaveFocus();
	await userEvent.keyboard('{Escape}');
	await expect
		.element(screen.getByRole('button', { name: 'Chat with the assistant' }))
		.toHaveFocus();
});

it('keeps a draft when the listing handoff fails asynchronously', async () => {
	await page.viewport(1440, 900);
	const screen = await render(Chat, {
		locale: 'en',
		messages: [],
		pending: false,
		onSend: () => Promise.resolve(false)
	});
	const field = screen.getByRole('textbox');
	await field.fill('Change the layout');
	await screen.getByRole('button', { name: 'Send' }).click();
	await expect.element(screen.getByRole('alert')).toBeVisible();
	await expect.element(field).toHaveValue('Change the layout');
});

it.each([
	['en', 'Online assistant'],
	['th', 'ผู้ช่วยออนไลน์']
] as const)('identifies a model-backed change in %s', async (locale, label) => {
	const screen = await render(Chat, {
		locale,
		pending: false,
		onSend: vi.fn(),
		messages: [{ id: 'reply', role: 'assistant', text: '✓', offline: false }]
	});
	await expect.element(screen.getByText(label, { exact: true })).toBeVisible();
});
