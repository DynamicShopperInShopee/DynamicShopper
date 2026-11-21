import { expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ProductShelf from './ProductShelf.svelte';
import type { ResolvePrintedFact } from './verifyFacts';
import './theme.css';

const themes = ['standard', 'minimal', 'vibrant', 'large-print'] as const;
const locales = ['en', 'th'] as const;
const viewports = [
	[1440, 900],
	[390, 844]
] as const;
const matrix = themes.flatMap((theme) =>
	locales.flatMap((locale) =>
		viewports.map(([width, height]) => ({ theme, locale, width, height }))
	)
);
const cooker = 'cooker-one-button';
const name = { en: 'One-button rice cooker', th: 'หม้อหุงข้าวปุ่มเดียว' };
const price = { en: '฿690', th: '690 บาท' };
const resolve: ResolvePrintedFact = (productId, field, locale) => {
	if (productId !== cooker) return;
	const identity = { productId, field, source: 'catalog' as const };
	if (field === 'name') return { ...identity, raw: name, text: name[locale] };
	if (field === 'price') return { ...identity, raw: 690, text: price[locale] };
};

function luminance(color: string) {
	const hex = color.trim().match(/^#([0-9a-f]{6})$/i)?.[1];
	if (!hex) throw new Error(`Expected a six-digit theme colour: ${color}`);
	const channels = [0, 2, 4].map((start) => {
		const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
		return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string) {
	const left = luminance(a);
	const right = luminance(b);
	return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
}

it.each(matrix)('$theme $locale at $width × $height keeps a legible shelf', async (entry) => {
	const { theme, locale, width, height } = entry;
	await page.viewport(width, height);
	const large = theme === 'large-print';
	const view = await render(ProductShelf, {
		layout: large ? 'large-print' : 'grid',
		locale,
		columns: [],
		productIds: [cooker],
		resolve,
		listingHref: () => '/product/cooker-one-button'
	});
	view.container.dataset.storefrontTheme = theme;

	const brand = getComputedStyle(view.container);
	const color = (token: string) => brand.getPropertyValue(token);
	for (const surface of ['--paper', '--surface']) {
		for (const foreground of ['--ink', '--muted', '--verified', '--void']) {
			expect(contrast(color(foreground), color(surface))).toBeGreaterThanOrEqual(4.5);
		}
	}
	expect(contrast(color('--accent'), color('--tile'))).toBeGreaterThanOrEqual(3);
	if (large) expect(contrast(color('--seam'), color('--paper'))).toBeGreaterThanOrEqual(3);

	const link = view.getByRole('link', { name: name[locale] });
	await expect.element(link).toBeVisible();
	await expect.element(view.getByText(price[locale])).toBeVisible();
	expect(link.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(large ? 48 : 44);
	expect(Number.parseFloat(getComputedStyle(link.element()).fontSize)).toBeGreaterThanOrEqual(
		large ? 20 : 12
	);
	expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
	(link.element() as HTMLElement).focus();
	await expect.element(link).toHaveFocus();
});
