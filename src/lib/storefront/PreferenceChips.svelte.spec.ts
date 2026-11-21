import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { defaultPlan } from '../personalization/plan';
import PreferenceChips from './PreferenceChips.svelte';

it('dispatches the selected removal through a localized button', async () => {
	const onRemove = vi.fn();
	const view = await render(PreferenceChips, {
		plan: { ...defaultPlan, specPreferences: { battery: 'higher', weight: 'lower' } },
		locale: 'th',
		onRemove
	});

	await view.getByRole('button', { name: 'นำ อายุแบตเตอรี่ · เน้นค่าสูง ออก' }).click();
	expect(onRemove).toHaveBeenCalledExactlyOnceWith(
		{ specPreferences: { weight: 'lower' } },
		'specPreferences',
		false
	);
	await expect.element(view.getByRole('button', { name: 'นำ น้ำหนัก · เน้นค่าต่ำ ออก' })).toBeVisible();
});
