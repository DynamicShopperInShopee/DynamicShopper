import { render } from 'vitest-browser-svelte';
import { expect, it, vi } from 'vitest';
import Xray from './Xray.svelte';

it('prints only known diagnostics and reports unmeasured model accuracy', async () => {
	const view = await render(Xray, {
		locale: 'en',
		forceOffline: false,
		onForceOffline: vi.fn(),
		trace: {
			backend: { kind: 'offline', reason: 'missing-key', config: 'SENTINEL_SECRET' },
			steps: [
				{ kind: 'catalog-search', count: 3 },
				{ kind: '฿1', count: 1 }
			],
			guard: 'replaced',
			merge: 'unchanged',
			ranked: 3,
			prompt: '<script>PRIVATE_PROMPT</script>',
			reply: 'Invented price ฿1',
			dropped: [
				{ field: 'theme', reason: 'unknown-value' },
				{ field: 'SENTINEL_FIELD', reason: 'server_key' }
			]
		}
	});
	await expect.element(view.getByText('Searched catalog')).toBeVisible();
	await expect.element(view.getByText(/No AI key/)).toBeVisible();
	await expect.element(view.getByText('Reply replaced')).toBeVisible();
	await expect.element(view.getByText('Model accuracy unavailable')).toBeVisible();
	expect(view.container.textContent).not.toMatch(/SENTINEL|PRIVATE_PROMPT|Invented price|฿1/);
});

it('shares the explicit offline control with the store and never shows an unknown model name', async () => {
	const onForceOffline = vi.fn();
	const view = await render(Xray, {
		locale: 'th',
		forceOffline: false,
		onForceOffline,
		trace: { backend: { kind: 'model', model: 'SENTINEL_SECRET' } },
		modelName: 'gpt-6.2-sol'
	});
	await view.getByRole('checkbox', { name: 'บังคับโหมดออฟไลน์' }).click();
	expect(onForceOffline).toHaveBeenCalledExactlyOnceWith(true);
	expect(view.container.textContent).not.toContain('SENTINEL_SECRET');
	await view.rerender({ trace: { backend: { kind: 'model', model: 'gpt-6.2-sol' } } });
	await expect.element(view.getByText('gpt-6.2-sol')).toBeVisible();
});
