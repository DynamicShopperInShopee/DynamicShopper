import { render } from 'vitest-browser-svelte';
import { expect, it } from 'vitest';
import CompareViews from './CompareViews.svelte';
import type { ResolvePrintedFact } from './verifyFacts';

const cooker = 'cooker-one-button';
const name = { en: 'One-button rice cooker', th: 'หม้อหุงข้าวปุ่มเดียว' };
const resolve: ResolvePrintedFact = (productId, field, locale) => {
	if (productId !== cooker) return;
	const identity = { productId, field, source: 'catalog' as const };
	if (field === 'name') return { ...identity, raw: name, text: name[locale] };
	if (field === 'price')
		return { ...identity, raw: 690, text: locale === 'th' ? '690 บาท' : '฿690' };
	if (field === 'spec.capacity') {
		return { ...identity, raw: 1.8, text: locale === 'th' ? '1.8 ลิตร' : '1.8 L' };
	}
};

it('switches one pane from Visual vibrant to Mom mode and checks both localized shelves', async () => {
	const screen = await render(CompareViews, {
		productIds: [cooker],
		columns: [{ field: 'spec.capacity', label: { en: 'Capacity', th: 'ความจุ' } }],
		resolve,
		listingHref: (id: string) => `/product/${id}`,
		locale: 'en'
	});
	const left = screen.getByRole('region', { name: 'Left view', exact: true });
	const right = screen.getByRole('region', { name: 'Right view', exact: true });
	await expect.element(left.getByRole('table')).toBeVisible();
	await expect.element(right.getByRole('combobox')).toHaveValue('visual');
	await expect.element(right.getByText('฿690')).toBeVisible();
	await right.getByRole('combobox').selectOptions('mom');
	await expect.element(left.getByText('฿690')).toBeVisible();
	await expect.element(right.getByText('690 บาท')).toBeVisible();
	await expect.element(right.getByText('1.8 ลิตร')).toBeVisible();
	await expect.element(screen.getByText('Facts identical (3 checked)')).toBeVisible();
});

it('keeps the shopper’s Thai in Tech and Visual panes', async () => {
	const screen = await render(CompareViews, {
		productIds: [cooker],
		columns: [],
		resolve,
		listingHref: (id: string) => `/product/${id}`,
		locale: 'th'
	});
	const left = screen.getByRole('region', { name: 'มุมมองซ้าย', exact: true });
	const right = screen.getByRole('region', { name: 'มุมมองขวา', exact: true });
	await expect.element(left.getByText('690 บาท')).toBeVisible();
	await expect.element(right.getByText('690 บาท')).toBeVisible();
	await expect.element(screen.getByText('ข้อมูลตรงกัน (ตรวจแล้ว 2 รายการ)')).toBeVisible();
});
