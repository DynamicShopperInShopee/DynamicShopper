import { createRawSnippet } from 'svelte';
import { afterEach, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import XrayDrawer from './XrayDrawer.svelte';
import './theme.css';

const children = createRawSnippet(() => ({
	render: () => '<p>Offline accuracy unavailable</p>'
}));

function addOpener(container: HTMLElement) {
	const button = document.createElement('button');
	button.textContent = 'Open X-ray';
	container.prepend(button);
	return button;
}

afterEach(async () => {
	window.scrollTo(0, 0);
	await page.viewport(1440, 900);
});

it('pins a 320px drawer on desktop and restores the header button after Escape', async () => {
	await page.viewport(1440, 900);
	const view = await render(XrayDrawer, { locale: 'en', open: false, children });
	const opener = addOpener(view.container);
	opener.style.marginBlockEnd = '6rem';
	const results = document.createElement('main');
	results.textContent = 'Product results';
	results.style.minHeight = '1800px';
	view.container.append(results);
	const resultsBounds = results.getBoundingClientRect();
	opener.focus();
	await view.rerender({ open: true, returnFocus: opener });
	const drawer = view.getByRole('complementary', { name: 'X-ray' });
	const close = drawer.getByRole('button', { name: 'Close X-ray' });
	await expect.element(close).toHaveFocus();
	await expect.element(drawer).toHaveAttribute('id', 'store-xray');
	const element = drawer.element();
	expect(element.getBoundingClientRect().width).toBe(320);
	expect(getComputedStyle(element.parentElement!).position).toBe('sticky');
	expect(getComputedStyle(element).borderInlineStartWidth).toBe('1px');
	expect(results.getBoundingClientRect().toJSON()).toEqual(resultsBounds.toJSON());
	expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
	await expect.element(drawer.getByText('Offline accuracy unavailable')).toBeVisible();
	expect(element.getBoundingClientRect().top).toBeGreaterThan(0);
	window.scrollTo(0, 500);
	await expect.poll(() => element.getBoundingClientRect().top).toBe(0);
	await userEvent.keyboard('{Escape}');
	await expect.element(drawer).not.toBeInTheDocument();
	expect(document.activeElement).toBe(opener);
});

it('opens a three-quarter-height modal sheet in Thai with large-print targets', async () => {
	await page.viewport(390, 844);
	const view = await render(XrayDrawer, { locale: 'th', open: false, children, id: 'proof' });
	view.container.dataset.storefrontTheme = 'large-print';
	const opener = addOpener(view.container);
	opener.focus();
	await view.rerender({ open: true, returnFocus: opener });
	const sheet = view.getByRole('dialog');
	const close = sheet.getByRole('button', { name: 'ปิดการดูขั้นตอน' });
	await expect.element(close).toHaveFocus();
	await expect.element(sheet).toHaveAttribute('id', 'proof');
	expect(sheet.element().matches(':modal')).toBe(true);
	const rect = sheet.element().getBoundingClientRect();
	expect(rect.width).toBe(390);
	expect(rect.height).toBe(633);
	expect(rect.bottom).toBe(844);
	expect(getComputedStyle(sheet.element()).borderBlockStartWidth).toBe('2px');
	expect(getComputedStyle(close.element()).fontSize).toBe('20px');
	expect(close.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
	await userEvent.keyboard('{Escape}');
	await expect.element(sheet).not.toBeInTheDocument();
	expect(document.activeElement).toBe(opener);
});

it('lets an open drawer become a modal on resize and restores focus when closed by its button', async () => {
	await page.viewport(1440, 900);
	const view = await render(XrayDrawer, { locale: 'en', open: false, children });
	const opener = addOpener(view.container);
	opener.focus();
	await view.rerender({ open: true, returnFocus: opener });
	await expect.element(view.getByRole('complementary')).toBeVisible();
	await page.viewport(390, 844);
	const sheet = view.getByRole('dialog', { name: 'X-ray' });
	await expect.element(sheet.getByRole('button', { name: 'Close X-ray' })).toHaveFocus();
	await sheet.getByRole('button', { name: 'Close X-ray' }).click();
	await expect.element(sheet).not.toBeInTheDocument();
	expect(document.activeElement).toBe(opener);
});
