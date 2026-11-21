import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Preferences from './Preferences.svelte';

const budget = { id: 'budget', label: { en: 'Budget set', th: 'กำหนดงบแล้ว' } };
const language = { id: 'language', label: { en: 'English', th: 'ภาษาอังกฤษ' } };
const mom = { id: 'mom', label: { en: 'Mom mode', th: 'โหมดสำหรับแม่' } };

it('targets one preference per removal and dispatches persona, undo and reset actions', async () => {
	const onRemove = vi.fn();
	const onPersona = vi.fn();
	const onUndo = vi.fn();
	const onReset = vi.fn();
	const view = await render(Preferences, {
		locale: 'en',
		chips: [budget, language],
		personas: [mom],
		canUndo: true,
		canReset: true,
		onRemove,
		onPersona,
		onUndo,
		onReset
	});

	await view.getByRole('button', { name: 'Remove Budget set' }).click();
	expect(onRemove).toHaveBeenCalledExactlyOnceWith('budget');
	await expect.element(view.getByRole('button', { name: 'Remove English' })).toBeVisible();
	await view.getByRole('combobox', { name: 'Persona' }).selectOptions('mom');
	expect(onPersona).toHaveBeenCalledExactlyOnceWith('mom');
	await view.getByRole('button', { name: 'Undo' }).click();
	await view.getByRole('button', { name: 'Reset' }).click();
	expect(onUndo).toHaveBeenCalledTimes(1);
	expect(onReset).toHaveBeenCalledTimes(1);
});

it('announces a change in Thai and hides the receipt when there is no change', async () => {
	const view = await render(Preferences, {
		locale: 'th',
		chips: [],
		personas: [mom],
		canUndo: false,
		canReset: false,
		onRemove: vi.fn(),
		onPersona: vi.fn(),
		onUndo: vi.fn(),
		onReset: vi.fn()
	});

	await expect.element(view.getByRole('button', { name: 'ย้อนกลับ' })).toBeDisabled();
	await expect.element(view.getByRole('button', { name: 'คืนค่าเริ่มต้น' })).toBeDisabled();
	await expect.element(view.getByText('สิ่งที่เปลี่ยน')).not.toBeInTheDocument();
	await view.rerender({ changes: [{ en: 'Larger text', th: 'ตัวอักษรใหญ่ขึ้น' }] });
	await expect.element(view.getByRole('status')).toHaveTextContent('สิ่งที่เปลี่ยน ตัวอักษรใหญ่ขึ้น');
	await view.rerender({ changes: [] });
	await expect.element(view.getByText('สิ่งที่เปลี่ยน')).not.toBeInTheDocument();
});
