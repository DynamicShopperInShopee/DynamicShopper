import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ShareLook from './ShareLook.svelte';
import { parseSharedLook } from './browserState';

const storefrontUrl = 'https://shop.example/demo/?private=cart#chat';
const plan = { theme: 'large-print', locale: 'th', conversation: ['private'], cart: ['private'] };
const presentationFields = ['theme', 'locale'];

afterEach(() => vi.restoreAllMocks());

it('copies a presentation-only URL and uses the same URL for LINE', async () => {
	const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
	const view = await render(ShareLook, { locale: 'en', storefrontUrl, plan, presentationFields });

	await view.getByRole('button', { name: 'Copy link' }).click();
	await expect.element(view.getByRole('status')).toHaveTextContent('Link copied');
	const shared = new URL(writeText.mock.calls[0][0]);
	expect(shared.origin + shared.pathname).toBe('https://shop.example/demo/');
	expect(shared.hash).toBe('');
	expect([...shared.searchParams.keys()]).toEqual(['look']);
	expect(
		parseSharedLook(shared.searchParams.get('look')!, presentationFields, (look) => look)
	).toEqual({ theme: 'large-print', locale: 'th' });

	const line = new URL(
		view.getByRole('link', { name: 'Share via LINE' }).element().getAttribute('href')!
	);
	expect(line.origin + line.pathname).toBe('https://social-plugins.line.me/lineit/share');
	expect(line.searchParams.get('url')).toBe(shared.href);
});

it('reveals a selectable link in Thai when clipboard access is denied', async () => {
	vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
		new DOMException('Denied', 'NotAllowedError')
	);
	const view = await render(ShareLook, { locale: 'th', storefrontUrl, plan, presentationFields });

	await view.getByRole('button', { name: 'คัดลอกลิงก์' }).click();
	const field = view.getByRole('textbox', { name: 'ลิงก์รูปแบบร้าน' });
	await expect.element(field).toHaveFocus();
	expect((field.element() as HTMLInputElement).selectionEnd).toBe(
		(field.element() as HTMLInputElement).value.length
	);
	await expect.element(view.getByRole('status')).toHaveTextContent('คัดลอกลิงก์จากช่องด้านล่างได้เลย');
});

it('offers no actions when no shareable fields are available', async () => {
	const view = await render(ShareLook, {
		locale: 'en',
		storefrontUrl,
		plan,
		presentationFields: []
	});

	await expect.element(view.getByText('A share link is unavailable')).toBeVisible();
	await expect.element(view.getByRole('button', { name: 'Copy link' })).not.toBeInTheDocument();
	await expect.element(view.getByRole('link', { name: 'Share via LINE' })).not.toBeInTheDocument();
});
